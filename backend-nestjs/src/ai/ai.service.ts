import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }

    private buildSystemContext(
        profile: Record<string, any>,
        results: Record<string, any>[],
    ): string {
        const profileSummary = Object.entries(profile)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        // Smart sampling of results to avoid token overflow while keeping context
        const totalRows = results.length;
        let sampleResults: Record<string, any>[];

        if (totalRows <= 20) {
            sampleResults = results;
        } else {
            // Take first 5, last 5, and some in between
            const first5 = results.slice(0, 5);
            const last5 = results.slice(-5);

            // Pick 10 evenly spaced items from the middle
            const middleCount = 10;
            const middleStart = 5;
            const middleEnd = totalRows - 5;
            const step = Math.max(1, Math.floor((middleEnd - middleStart) / middleCount));
            const middleRows: Record<string, any>[] = [];
            for (let i = middleStart; i < middleEnd && middleRows.length < middleCount; i += step) {
                middleRows.push(results[i]);
            }

            sampleResults = [...first5, ...middleRows, ...last5];
        }

        const resultsSummary = sampleResults.map((r) => JSON.stringify(r)).join('\n');

        return `
You are a financial planning assistant specialized in retirement advice.
Use the following profile data and projections to answer the user's question clearly.

Profile Information:
${profileSummary}

Retirement Projection Summary (partial):
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

        if (history) {
            for (const msg of history) {
                if (['user', 'assistant'].includes(msg.role) && msg.content) {
                    messages.push({
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                    });
                }
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
}
