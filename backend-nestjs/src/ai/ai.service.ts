import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { InfoCache, InfoCacheDocument } from './schemas/info-cache.schema';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor(
        private configService: ConfigService,
        @InjectModel(InfoCache.name) private infoCacheModel: Model<InfoCacheDocument>,
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }

    /**
     * Smart sampling of results that guarantees critical rows are included:
     * - First 10 rows (beginning of timeline)
     * - Last 10 rows (end of timeline)
     * - Depletion row (first row where final_value < 0)
     * - Target date row (if specified in profile)
     */
    private buildSmartSample(
        results: Record<string, any>[],
        profile: Record<string, any>,
    ): { sample: Record<string, any>[]; metadata: string } {
        const totalRows = results.length;

        if (totalRows <= 20) {
            return {
                sample: results,
                metadata: `Complete timeline: ${totalRows} rows`,
            };
        }

        // Use Set to avoid duplicates
        const criticalIndices = new Set<number>();

        // Always include first 10 rows
        for (let i = 0; i < Math.min(10, totalRows); i++) {
            criticalIndices.add(i);
        }

        // Always include last 10 rows
        for (let i = Math.max(0, totalRows - 10); i < totalRows; i++) {
            criticalIndices.add(i);
        }

        // Find and include depletion row (first negative final_value)
        const depletionIndex = results.findIndex((r) => r.final_value < 0);
        if (depletionIndex >= 0) {
            criticalIndices.add(depletionIndex);
            // Also include the row before depletion for context
            if (depletionIndex > 0) {
                criticalIndices.add(depletionIndex - 1);
            }
        }

        // Find and include target date row if specified
        const targetAge = profile.targetAge || profile.target_age;
        if (targetAge) {
            const targetIndex = results.findIndex((r) => r.age >= targetAge);
            if (targetIndex >= 0) {
                criticalIndices.add(targetIndex);
            }
        }

        // Convert to sorted array and extract rows
        const indices = Array.from(criticalIndices).sort((a, b) => a - b);
        const sample = indices.map((i) => results[i]);

        // Build metadata string
        const metadata = [
            `Sampled ${sample.length} of ${totalRows} rows`,
            `Includes: First 10, Last 10`,
            depletionIndex >= 0 ? `Depletion at row ${depletionIndex + 1} (age ${results[depletionIndex].age})` : 'No depletion detected',
            targetAge ? `Target age ${targetAge} included` : '',
        ]
            .filter(Boolean)
            .join(' | ');

        return { sample, metadata };
    }

    /**
     * Summarize conversation history when it gets too long.
     * Keeps recent messages and summarizes older ones.
     */
    private async summarizeHistory(
        history: Array<{ role: string; content: string }>,
    ): Promise<Array<{ role: string; content: string }>> {
        const MAX_TURNS = 10; // Keep last 10 turns (20 messages)
        const SUMMARIZE_THRESHOLD = 12; // Summarize if more than 12 turns

        // Count conversation turns (pairs of user + assistant)
        const turns = Math.floor(history.length / 2);

        if (turns <= SUMMARIZE_THRESHOLD) {
            return history; // No need to summarize yet
        }

        // Keep the last MAX_TURNS turns
        const recentHistory = history.slice(-MAX_TURNS * 2);

        // Summarize the older messages
        const olderHistory = history.slice(0, -MAX_TURNS * 2);

        if (olderHistory.length === 0) {
            return recentHistory;
        }

        try {
            // Create a summary of the older conversation
            const summaryPrompt = `Summarize the following conversation between a user and a financial assistant. 
Focus on key questions asked, important advice given, and any decisions or insights discussed.
Keep it concise (max 200 words).

Conversation to summarize:
${olderHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n')}`;

            const summaryResponse = await this.openai.chat.completions.create({
                model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4-turbo'),
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.5,
                max_tokens: 300,
            });

            const summary = summaryResponse.choices[0].message.content?.trim() || '';

            // Return summary + recent history
            return [
                {
                    role: 'assistant',
                    content: `[Previous conversation summary: ${summary}]`,
                },
                ...recentHistory,
            ];
        } catch (error) {
            // If summarization fails, just truncate
            console.error('Failed to summarize history:', error);
            return recentHistory;
        }
    }

    private buildSystemContext(
        profile: Record<string, any>,
        results: Record<string, any>[],
    ): string {
        const profileSummary = Object.entries(profile)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        // Use smart sampling with guaranteed critical rows
        const { sample, metadata } = this.buildSmartSample(results, profile);
        const resultsSummary = sample.map((r) => JSON.stringify(r)).join('\n');

        return `
You are a financial planning assistant specialized in retirement advice.
Use the following profile data and projections to answer the user's question clearly.

Profile Information:
${profileSummary}

Retirement Projection Summary:
[${metadata}]
${resultsSummary}

Provide a concise answer.
Avoid generic explanations or repeating the question.
Focus only on actionable, realistic advice related to this scenario.
If appropriate, use Markdown for light formatting (e.g., **bold**, bullet lists).
Answer in the same language as the question.

IMPORTANT: If the user asks for a specific number of items (e.g., "1 tip", "3 recommendations"), YOU MUST STRICTLY ADHERE TO THAT NUMBER. Do not provide more than requested.
    `.trim();
    }

    async generateAiResponse(
        profile: Record<string, any>,
        results: Record<string, any>[],
        question: string,
        history?: Array<{ role: string; content: string }>,
    ): Promise<{ answer: string }> {
        const systemContext = this.buildSystemContext(profile, results);

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemContext },
        ];

        // Summarize history if it's too long
        let processedHistory = history || [];
        if (history && history.length > 0) {
            processedHistory = await this.summarizeHistory(history);
        }

        // Add processed history to messages
        for (const msg of processedHistory) {
            if (['user', 'assistant'].includes(msg.role) && msg.content) {
                messages.push({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                });
            }
        }

        messages.push({ role: 'user', content: question });

        const response = await this.openai.chat.completions.create({
            model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4-turbo'),
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const answer = response.choices[0].message.content?.trim() || '';
        return { answer };
    }

    async getInfo(key: string, prompt: string, forceRefresh = false): Promise<{ content: string; cached: boolean }> {
        if (!forceRefresh) {
            const cached = await this.infoCacheModel.findOne({ key, expiresAt: { $gt: new Date() } });
            if (cached) {
                console.log(`Using cached info for key: ${key}`);
                return { content: cached.content, cached: true };
            }
        }

        const response = await this.openai.chat.completions.create({
            model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4-turbo'),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3, // Lower temperature for factual info
            max_tokens: 500,
        });

        const content = response.choices[0].message.content?.trim() || '';

        // Cache the result
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 2); // 2 months TTL

        console.log(`Caching info for key: ${key}`);
        const result = await this.infoCacheModel.findOneAndUpdate(
            { key },
            { $set: { content, expiresAt } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        console.log(`Cache saved for key: ${key}, result id: ${result?._id}`);

        return { content, cached: false };
    }
}
