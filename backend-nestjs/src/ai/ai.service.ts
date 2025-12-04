import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { InfoCache, InfoCacheDocument } from './schemas/info-cache.schema';

import { RetirementCalculatorService } from '../retirement/retirement-calculator.service';
import { Profile } from '../profiles/schemas/profile.schema';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor(
        private configService: ConfigService,
        @InjectModel(InfoCache.name) private infoCacheModel: Model<InfoCacheDocument>,
        private retirementCalculator: RetirementCalculatorService,
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

    private addYearsToDateString(dateStr: string | undefined, years: number): string | undefined {
        if (!dateStr) return undefined;
        try {
            const parts = dateStr.split('/');
            if (parts.length === 2) {
                const month = parseInt(parts[0], 10);
                const year = parseInt(parts[1], 10);
                return `${month.toString().padStart(2, '0')}/${year + years}`;
            }
        } catch (e) {
            return dateStr;
        }
        return dateStr;
    }

    private getDepletionAge(calculation: any): number | null {
        const timeline = calculation.assumptions.timeline;
        const depletionRow = timeline.find((r: any) => r.final_value < 0);
        if (depletionRow) return depletionRow.age;
        // If no depletion, return age of last row
        return timeline.length > 0 ? timeline[timeline.length - 1].age : null;
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

        // --- Gap Analysis (Base Case) ---
        const depletionRow = results.find((r) => r.final_value < 0);
        const baseDepletionAge = depletionRow ? depletionRow.age : null;
        const targetAge = 100;
        const gapYears = baseDepletionAge ? targetAge - baseDepletionAge : 0;

        // --- Sensitivity Analysis (Simulations) ---
        // We cast profile to any to match the interface expected by calculator
        const p = { ...profile } as any;

        let sensitivityReport = "";

        if (baseDepletionAge && baseDepletionAge < targetAge) {
            sensitivityReport = "RELATÓRIO DE SENSIBILIDADE (SIMULAÇÕES REAIS):\n";

            // Scenario 1: Work 1 Year Longer
            const p1 = { ...p, endOfSalaryYears: this.addYearsToDateString(p.endOfSalaryYears, 1) };
            const calc1 = this.retirementCalculator.calculateRetirement(p1);
            const age1 = this.getDepletionAge(calc1);
            sensitivityReport += `- Trabalhar +1 ano: Dinheiro dura até ${age1} anos (Ganho de ${age1 && baseDepletionAge ? age1 - baseDepletionAge : 0} anos)\n`;

            // Scenario 2: Work 2 Years Longer
            const p2 = { ...p, endOfSalaryYears: this.addYearsToDateString(p.endOfSalaryYears, 2) };
            const calc2 = this.retirementCalculator.calculateRetirement(p2);
            const age2 = this.getDepletionAge(calc2);
            sensitivityReport += `- Trabalhar +2 anos: Dinheiro dura até ${age2} anos\n`;

            // Scenario 3: Reduce Expenses by 10%
            const p3 = { ...p, monthlyExpenseRecurring: p.monthlyExpenseRecurring * 0.9 };
            const calc3 = this.retirementCalculator.calculateRetirement(p3);
            const age3 = this.getDepletionAge(calc3);
            sensitivityReport += `- Reduzir despesas em 10% (R$ ${(p.monthlyExpenseRecurring * 0.1).toFixed(2)}): Dinheiro dura até ${age3} anos\n`;

            // Scenario 4: Sell 20% of Fixed Assets
            if (p.fixedAssets > 0) {
                const sellAmount = p.fixedAssets * 0.2;
                const p4 = { ...p, fixedAssets: p.fixedAssets - sellAmount, totalAssets: p.totalAssets + sellAmount };
                const calc4 = this.retirementCalculator.calculateRetirement(p4);
                const age4 = this.getDepletionAge(calc4);
                sensitivityReport += `- Vender 20% dos Ativos Fixos (R$ ${sellAmount.toFixed(2)}): Dinheiro dura até ${age4} anos\n`;
            }
        }

        let gapAnalysis = '';
        if (baseDepletionAge) {
            const lastRow = results[results.length - 1];
            const shortfall = lastRow ? lastRow.final_value : 0; // Likely negative
            gapAnalysis = `
ANÁLISE DE LACUNA (GAP):
- O dinheiro acaba na idade: ${baseDepletionAge}
- Meta de cobertura: até ${targetAge} anos
- Lacuna a cobrir: ${gapYears} anos
- Saldo final projetado aos ${lastRow?.age || targetAge} anos: ${shortfall} (Valor negativo indica falta de fundos)
            `.trim();
        } else {
            gapAnalysis = `
ANÁLISE DE LACUNA (GAP):
- O dinheiro NÃO acaba antes dos ${results[results.length - 1]?.age} anos.
- Situação confortável baseada nas projeções atuais.
            `.trim();
        }

        return `
Você é um concierge financeiro especializado em planejamento de aposentadoria.
Sua missão é ajudar o usuário a cobrir a lacuna financeira (se houver) e otimizar seu patrimônio.

Informações do Perfil:
${profileSummary}

${gapAnalysis}

${sensitivityReport}

Resumo das Projeções de Aposentadoria (Cenário Base):
[${metadata}]
${resultsSummary}

IMPORTANTE: Todas as respostas devem ser em português brasileiro.

DIRETRIZES ESTRITAS:
1. **USE OS DADOS DO RELATÓRIO DE SENSIBILIDADE**: Não "chute" o impacto de trabalhar mais ou economizar. Use os números calculados acima (ex: "Se trabalhar 1 ano a mais, seu dinheiro dura até os X anos").
2. **Respeite o Perfil**:
   - O usuário tem **${(profile.monthlyReturnRate * 100).toFixed(2)}% de retorno MENSAL**. Isso é aprox ${(Math.pow(1 + (profile.monthlyReturnRate || 0), 12) - 1) * 100}% ANUAL.
   - Se o retorno já é alto (acima de 0.8% a.m.), NÃO sugira aumentar o risco/retorno, pois já é agressivo.
   - Se o usuário tem Ativos Fixos (${profile.fixedAssets}), considere a venda como opção real (veja simulação).
3. **Seja Realista**: Não sugira aportes milionários impossíveis. Foque nas alavancas que mais movem o ponteiro (tempo de trabalho, despesas).

ESTRATÉGIA DE RESPOSTA:
1. Comece apresentando a realidade (quando o dinheiro acaba).
2. Apresente as soluções baseadas nas SIMULAÇÕES acima. Diga exatamente o impacto.
3. Se o usuário perguntar "como ter dinheiro até os 100 anos?", combine as estratégias (ex: "Trabalhar 1 ano a mais E reduzir 10% das despesas resolveria...").

Forneça respostas concisas, diretas e baseadas em dados.
    `.trim();
    }


    async generateAiResponse(
        profile: Record<string, any>,
        results: Record<string, any>[],
        question: string,
        history?: Array<{ role: string; content: string }>,
    ): Promise<{ answer: string }> {
        const { ChatOpenAI } = await import('@langchain/openai');
        const { HumanMessage, AIMessage, SystemMessage } = await import('@langchain/core/messages');
        const { RetirementTools } = await import('./langchain-tools.js');

        // Create tools
        const retirementTools = new RetirementTools(this.retirementCalculator);
        const tools = retirementTools.getAllTools();

        // Create LLM with tool binding
        const model = new ChatOpenAI({
            modelName: this.configService.get<string>('OPENAI_MODEL', 'gpt-4-turbo'),
            temperature: 0.7,
            openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        }).bindTools(tools);

        // Format history
        const messages = [
            new SystemMessage(this.buildAgentSystemPrompt(profile, results)),
            ...(history || []).map(msg =>
                msg.role === 'user'
                    ? new HumanMessage(msg.content)
                    : new AIMessage(msg.content)
            ),
            new HumanMessage(question),
        ];

        // Simple agent loop
        try {
            let currentMessages = [...messages];
            const maxIterations = 5;
            let iteration = 0;

            while (iteration < maxIterations) {
                const response = await model.invoke(currentMessages);

                // Check if the model wants to call tools
                if (!response.additional_kwargs.tool_calls || response.additional_kwargs.tool_calls.length === 0) {
                    // No tool calls - return the final answer
                    return { answer: response.content as string };
                }

                // Process tool calls
                currentMessages.push(response);

                for (const toolCall of response.additional_kwargs.tool_calls) {
                    const tool = tools.find(t => t.name === toolCall.function.name);
                    if (tool) {
                        try {
                            const toolInput = JSON.parse(toolCall.function.arguments);
                            // Add profile data to tool input
                            toolInput.profileData = profile;

                            const toolResult = await tool.invoke(toolInput);

                            // Add tool response to messages
                            currentMessages.push({
                                role: 'tool',
                                content: toolResult,
                                tool_call_id: toolCall.id,
                            } as any);
                        } catch (error) {
                            console.error(`Tool ${toolCall.function.name} error:`, error);
                            currentMessages.push({
                                role: 'tool',
                                content: `Erro ao executar ferramenta: ${error.message}`,
                                tool_call_id: toolCall.id,
                            } as any);
                        }
                    }
                }

                iteration++;
            }

            // Max iterations reached
            return {
                answer: 'Desculpe, não consegui processar completamente sua pergunta. Por favor, tente ser mais específico.',
            };
        } catch (error) {
            console.error('Agent execution error:', error);
            return {
                answer: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
            };
        }
    }

    /**
     * Build system prompt for the LangChain agent
     */
    private buildAgentSystemPrompt(
        profile: Record<string, any>,
        results: Record<string, any>[],
    ): string {
        // Basic gap analysis
        const depletionRow = results.find((r) => r.final_value < 0);
        const baseDepletionAge = depletionRow ? depletionRow.age : null;
        const targetAge = 100;

        const monthlyReturnPercent = (profile.monthlyReturnRate * 100).toFixed(2);
        const annualReturnPercent = ((Math.pow(1 + profile.monthlyReturnRate, 12) - 1) * 100).toFixed(2);

        return `
Você é um consultor financeiro especializado em planejamento de aposentadoria, trabalhando para ajudar seu cliente a tomar decisões financeiras inteligentes.

PERFIL DO CLIENTE:
- Idade atual: ${profile.baseAge} anos
- Ativos totais: R$ ${profile.totalAssets.toLocaleString('pt-BR')}
- Ativos fixos (imóveis, etc.): R$ ${profile.fixedAssets.toLocaleString('pt-BR')}
- Ativos líquidos: R$ ${(profile.totalAssets - profile.fixedAssets).toLocaleString('pt-BR')}
- Salário mensal líquido: R$ ${profile.monthlySalaryNet.toLocaleString('pt-BR')}
- Despesas mensais: R$ ${(profile.monthlyExpenseRecurring).toLocaleString('pt-BR')}
- Retorno de investimentos: ${monthlyReturnPercent}% ao mês (aprox ${annualReturnPercent}% ao ano)
- Inflação anual: ${(profile.annualInflation * 100).toFixed(2)}%
- Aposentadoria do governo: R$ ${profile.governmentRetirementIncome.toLocaleString('pt-BR')}/mês

SITUAÇÃO ATUAL:
${baseDepletionAge ? `O dinheiro do cliente acaba aos ${baseDepletionAge} anos. Meta: ${targetAge} anos. Lacuna: ${targetAge - baseDepletionAge} anos.` : 'Situação confortável - fundos devem durar além dos 100 anos.'}

SUAS FERRAMENTAS:
Você tem acesso a ferramentas de simulação que calculam o impacto EXATO de diferentes estratégias:
- simulate_work_longer: Calcula o impacto de trabalhar N anos a mais
- simulate_reduce_expenses: Calcula o impacto de reduzir despesas em X%
- simulate_sell_fixed_assets: Calcula o impacto de vender ativos fixos
- simulate_custom_scenario: Combina múltiplas estratégias
- find_work_years_for_target: **NOVA** Calcula EXATAMENTE quantos anos trabalhar para atingir idade alvo
- find_expense_reduction_for_target: **NOVA** Calcula EXATAMENTE quanto % reduzir despesas para atingir idade alvo
- get_profile_summary: Obtém resumo detalhado do perfil
- analyze_baseline_projections: Analisa o cenário base atual

DIRETRIZES IMPORTANTES:

1. **USE AS FERRAMENTAS**: Sempre que o cliente perguntar sobre cenários ("e se eu trabalhar mais?", "quanto preciso economizar?", etc.), USE a ferramenta apropriada para calcular o impacto real. NÃO tente adivinhar ou estimar - calcule!

2. **RASTREAMENTO DE CONTEXTO (CRÍTICO)**:
   Quando o usuário fizer perguntas de SEGUIMENTO sobre cenários já discutidos:
   
   ✅ **CORRETO**:
   User: "Posso vender todos meus ativos"
   Agent: [usa simulate_sell_fixed_assets com 100%] → "Dinheiro dura até 64 anos"
   User: "Quantos anos trabalhar a mais NESTE CENÁRIO?"
   Agent: [usa find_work_years_for_target com targetAge=80 e currentModifications contendo fixedAssetsSellPercent=100]
   
   ❌ **ERRADO**:
   User: "Quantos anos trabalhar a mais NESTE CENÁRIO?"
   Agent: [ignora que ativos foram vendidos] → resposta incorreta
   
   **Palavras-chave para identificar contexto**:
   - "neste cenário"
   - "com essas mudanças"  
   - "considerando isso"
   - "mantendo as modificações"
   - "além disso"
   
   **Como rastrear**:
   1. Revise a conversa anterior
   2. Identifique modificações já aplicadas (venda de ativos, redução de despesas, etc.)
   3. Passe essas modificações em currentModifications para find_work_years_for_target

3. **RESPEITE O PERFIL**: 
   - O retorno de ${monthlyReturnPercent}% ao mês é ALTO (equivale a ${annualReturnPercent}% ao ano).
   - NÃO sugira "aumentar retorno" se já está acima de 0.8% ao mês - isso já é agressivo.
   - O cliente TEM R$ ${profile.fixedAssets.toLocaleString('pt-BR')} em ativos fixos - vender parte deles é uma opção real.

4. **SEJA ESPECÍFICO E QUANTITATIVO**:
   - Sempre cite números das simulações
   - Use valores exatos em Reais quando relevante
   - Explique o impacto em anos de cobertura

5. **COMBINE ESTRATÉGIAS**:
   - Se uma estratégia sozinha não resolve, sugira combinações
   - Use simulate_custom_scenario para testar múltiplas mudanças de uma vez

5. **PORTUGUÊS BRASILEIRO**:
   - Todas as respostas em português brasileiro
   - Use formatação Markdown leve (negrito, listas)

6. **FOQUE NO QUE IMPORTA**:
   - Priorize alavancas que mais impactam: tempo de trabalho, despesas, uso de ativos fixos
   - Evite sugestões impossíveis (aportes milionários, etc.)

EXEMPLO DE BOA RESPOSTA:
"Analisando sua situação, seu dinheiro acaba aos 76 anos.  Para chegar aos 100 anos, você tem algumas opções:

🔹 **Trabalhar 1 ano a mais**: [calcula usando ferramenta] Seu dinheiro duraria até os 99 anos - quase lá!

🔹 **Reduzir despesas em 10%**: [calcula] Isso economizaria R$ XXX/mês e estenderia até os YY anos.

🔹 **Combinação**: Trabalhar 1 ano a mais + reduzir 5% das despesas = [calcula cenário combinado] chegaria aos 100 anos com folga."

Lembre-se: Você é um consultor de confiança. Seja direto, baseado em dados, e focado em soluções práticas.
        `.trim();
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
