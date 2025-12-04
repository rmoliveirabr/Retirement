import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { RetirementCalculatorService } from '../retirement/retirement-calculator.service';

/**
 * LangChain tools for retirement planning calculations.
 * Each tool wraps the RetirementCalculatorService to perform specific simulations.
 */
export class RetirementTools {
    constructor(private calculator: RetirementCalculatorService) { }

    /**
     * Helper to add years to MM/YYYY date string
     */
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

    /**
     * Helper to get depletion age from calculation result
     */
    private getDepletionAge(calculation: any): number | null {
        const timeline = calculation.assumptions.timeline;
        const depletionRow = timeline.find((r: any) => r.final_value < 0);
        if (depletionRow) return depletionRow.age;
        return timeline.length > 0 ? timeline[timeline.length - 1].age : null;
    }

    /**
     * Tool: Simulate working N additional years
     */
    createWorkLongerTool() {
        return new DynamicStructuredTool({
            name: 'simulate_work_longer',
            description: 'Simula o impacto de trabalhar por mais N anos. Retorna até que idade o dinheiro durará e o ganho em anos comparado ao cenário base.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                additionalYears: z.number().describe('Número de anos adicionais de trabalho (1, 2, 3, etc.)'),
            }),
            func: async ({ profileData, additionalYears }) => {
                const profile = { ...profileData };
                profile.endOfSalaryYears = this.addYearsToDateString(profile.endOfSalaryYears, additionalYears);

                const calculation = this.calculator.calculateRetirement(profile);
                const depletionAge = this.getDepletionAge(calculation);

                return JSON.stringify({
                    scenario: `Trabalhar +${additionalYears} ano(s)`,
                    depletionAge: depletionAge,
                    description: `Se trabalhar ${additionalYears} ano(s) a mais, o dinheiro dura até os ${depletionAge} anos.`,
                });
            },
        });
    }

    /**
     * Tool: Simulate reducing expenses by X%
     */
    createReduceExpensesTool() {
        return new DynamicStructuredTool({
            name: 'simulate_reduce_expenses',
            description: 'Simula o impacto de reduzir TODAS as despesas mensais em X%. Retorna até que idade o dinheiro durará.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                reductionPercentage: z.number().describe('Percentual de redução de despesas (ex: 10 para 10%, 20 para 20%)'),
            }),
            func: async ({ profileData, reductionPercentage }) => {
                const profile = { ...profileData };
                const originalRecurring = profile.monthlyExpenseRecurring;
                const originalOneTime = profile.oneTimeAnnualExpense;

                // Reduce BOTH recurring and one-time expenses proportionally
                profile.monthlyExpenseRecurring = originalRecurring * (1 - reductionPercentage / 100);
                profile.oneTimeAnnualExpense = originalOneTime * (1 - reductionPercentage / 100);

                const calculation = this.calculator.calculateRetirement(profile);
                const depletionAge = this.getDepletionAge(calculation);

                const totalOriginal = originalRecurring + (originalOneTime / 12);
                const totalNew = profile.monthlyExpenseRecurring + (profile.oneTimeAnnualExpense / 12);
                const savedAmount = totalOriginal - totalNew;

                return JSON.stringify({
                    scenario: `Reduzir despesas em ${reductionPercentage}%`,
                    depletionAge: depletionAge,
                    monthlySavings: savedAmount,
                    description: `Reduzindo TODAS as despesas em ${reductionPercentage}% (economizando R$ ${savedAmount.toFixed(2)}/mês no total), o dinheiro dura até os ${depletionAge} anos.`,
                });
            },
        });
    }

    /**
     * Tool: Simulate selling X% of fixed assets
     */
    createSellAssetsTool() {
        return new DynamicStructuredTool({
            name: 'simulate_sell_fixed_assets',
            description: 'Simula o impacto de vender X% dos ativos fixos (imóveis, etc.) e converter em ativos líquidos. Retorna até que idade o dinheiro durará.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                sellPercentage: z.number().describe('Percentual de ativos fixos a vender (ex: 20 para 20%, 50 para 50%)'),
            }),
            func: async ({ profileData, sellPercentage }) => {
                const profile = { ...profileData };
                const sellAmount = profile.fixedAssets * (sellPercentage / 100);

                // CRITICAL: Only reduce fixedAssets, don't touch totalAssets
                // totalAssets already includes fixedAssets, so this converts fixed→liquid
                profile.fixedAssets = profile.fixedAssets - sellAmount;
                // DO NOT add to totalAssets - that would double-count!

                const calculation = this.calculator.calculateRetirement(profile);
                const depletionAge = this.getDepletionAge(calculation);

                return JSON.stringify({
                    scenario: `Vender ${sellPercentage}% dos ativos fixos`,
                    depletionAge: depletionAge,
                    soldAmount: sellAmount,
                    description: `Vendendo ${sellPercentage}% dos ativos fixos (R$ ${sellAmount.toFixed(2)}), o dinheiro dura até os ${depletionAge} anos.`,
                });
            },
        });
    }

    /**
     * Tool: Run custom scenario with multiple parameter changes
     */
    createCustomScenarioTool() {
        return new DynamicStructuredTool({
            name: 'simulate_custom_scenario',
            description: 'Simula um cenário personalizado com múltiplas mudanças nos parâmetros. Use quando precisar combinar várias estratégias.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                changes: z.object({
                    additionalWorkYears: z.number().optional().describe('Anos adicionais de trabalho'),
                    expenseReductionPercent: z.number().optional().describe('Percentual de redução de despesas'),
                    fixedAssetsSellPercent: z.number().optional().describe('Percentual de ativos fixos a vender'),
                    monthlyReturnRate: z.number().optional().describe('Nova taxa de retorno mensal (decimal)'),
                }).describe('Mudanças a aplicar no perfil'),
            }),
            func: async ({ profileData, changes }) => {
                const profile = { ...profileData };
                const appliedChanges: string[] = [];

                if (changes.additionalWorkYears) {
                    profile.endOfSalaryYears = this.addYearsToDateString(profile.endOfSalaryYears, changes.additionalWorkYears);
                    appliedChanges.push(`Trabalhar +${changes.additionalWorkYears} ano(s)`);
                }

                if (changes.expenseReductionPercent) {
                    profile.monthlyExpenseRecurring = profile.monthlyExpenseRecurring * (1 - changes.expenseReductionPercent / 100);
                    profile.oneTimeAnnualExpense = profile.oneTimeAnnualExpense * (1 - changes.expenseReductionPercent / 100);
                    appliedChanges.push(`Reduzir despesas em ${changes.expenseReductionPercent}%`);
                }

                if (changes.fixedAssetsSellPercent) {
                    const sellAmount = profile.fixedAssets * (changes.fixedAssetsSellPercent / 100);
                    profile.fixedAssets -= sellAmount;
                    // Don't add to totalAssets - it already includes fixedAssets
                    appliedChanges.push(`Vender ${changes.fixedAssetsSellPercent}% dos ativos fixos`);
                }

                if (changes.monthlyReturnRate !== undefined) {
                    profile.monthlyReturnRate = changes.monthlyReturnRate;
                    appliedChanges.push(`Ajustar retorno mensal para ${(changes.monthlyReturnRate * 100).toFixed(2)}%`);
                }

                const calculation = this.calculator.calculateRetirement(profile);
                const depletionAge = this.getDepletionAge(calculation);

                return JSON.stringify({
                    scenario: 'Cenário combinado',
                    appliedChanges: appliedChanges,
                    depletionAge: depletionAge,
                    description: `Aplicando: ${appliedChanges.join(', ')}. O dinheiro dura até os ${depletionAge} anos.`,
                });
            },
        });
    }

    /**
     * Tool: Get profile summary
     */
    createProfileSummaryTool() {
        return new DynamicStructuredTool({
            name: 'get_profile_summary',
            description: 'Retorna um resumo formatado do perfil financeiro do usuário.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
            }),
            func: async ({ profileData }) => {
                const profile = profileData;
                const monthlyReturn = (profile.monthlyReturnRate * 100).toFixed(2);
                const annualReturn = ((Math.pow(1 + profile.monthlyReturnRate, 12) - 1) * 100).toFixed(2);

                return JSON.stringify({
                    age: profile.baseAge,
                    totalAssets: profile.totalAssets,
                    fixedAssets: profile.fixedAssets,
                    liquidAssets: profile.totalAssets - profile.fixedAssets,
                    monthlySalary: profile.monthlySalaryNet,
                    monthlyExpenses: profile.monthlyExpenseRecurring,
                    monthlyReturn: `${monthlyReturn}% (aprox ${annualReturn}% anual)`,
                    governmentRetirement: profile.governmentRetirementIncome,
                    inflation: `${(profile.annualInflation * 100).toFixed(2)}%`,
                });
            },
        });
    }

    /**
     * Tool: Get baseline projections analysis
     */
    createBaselineAnalysisTool() {
        return new DynamicStructuredTool({
            name: 'analyze_baseline_projections',
            description: 'Analisa as projeções do cenário base atual e retorna informações sobre quando o dinheiro acaba e lacuna até os 100 anos.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
            }),
            func: async ({ profileData }) => {
                const calculation = this.calculator.calculateRetirement(profileData);
                const depletionAge = this.getDepletionAge(calculation);
                const targetAge = 100;
                const timeline = calculation.assumptions.timeline;

                return JSON.stringify({
                    depletionAge: depletionAge,
                    gapYears: depletionAge ? Math.max(0, targetAge - depletionAge) : 0,
                    targetAge: targetAge,
                    totalRetirementFund: calculation.totalRetirementFund,
                    fixedAssetsAtRetirement: calculation.assumptions.fixedAssetsAtRetirement,
                    status: depletionAge && depletionAge < targetAge
                        ? `Dinheiro acaba aos ${depletionAge} anos. Faltam ${targetAge - depletionAge} anos para meta de ${targetAge} anos.`
                        : `Situação confortável. Dinheiro dura até pelo menos ${depletionAge} anos.`,
                    finalBalance: timeline[timeline.length - 1]?.final_value || 0,
                });
            },
        });
    }

    /**
     * Tool: Find exact work years needed to reach target age
     */
    createFindWorkYearsForTargetTool() {
        return new DynamicStructuredTool({
            name: 'find_work_years_for_target',
            description: 'Calcula EXATAMENTE quantos anos ADICIONAIS trabalhar para atingir uma idade alvo específica. Use quando o usuário perguntar "quantos anos trabalhar para chegar a X anos" ou "quantos anos a mais neste cenário". IMPORTANTE: Se o usuário mencionou modificações anteriores (vendeu ativos, reduziu despesas), passe essas modificações em currentModifications.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                targetAge: z.number().describe('Idade alvo que o usuário quer atingir (ex: 80, 100)'),
                currentModifications: z.object({
                    fixedAssetsSellPercent: z.number().optional().describe('% de ativos fixos já vendidos no cenário'),
                    expenseReductionPercent: z.number().optional().describe('% de redução de despesas já aplicada'),
                    monthlyReturnRate: z.number().optional().describe('Nova taxa de retorno se modificada'),
                }).optional().describe('Modificações JÁ APLICADAS no cenário que está sendo discutido'),
            }),
            func: async ({ profileData, targetAge, currentModifications }) => {
                let profile = { ...profileData };
                const appliedMods: string[] = [];

                // Apply current scenario modifications FIRST
                if (currentModifications?.fixedAssetsSellPercent) {
                    const sellAmount = profile.fixedAssets * (currentModifications.fixedAssetsSellPercent / 100);
                    profile.fixedAssets -= sellAmount;
                    // Don't add to totalAssets - it already includes fixedAssets
                    appliedMods.push(`Vendeu ${currentModifications.fixedAssetsSellPercent}% dos ativos fixos`);
                }

                if (currentModifications?.expenseReductionPercent) {
                    profile.monthlyExpenseRecurring *= (1 - currentModifications.expenseReductionPercent / 100);
                    appliedMods.push(`Reduziu ${currentModifications.expenseReductionPercent}% das despesas`);
                }

                if (currentModifications?.monthlyReturnRate !== undefined) {
                    profile.monthlyReturnRate = currentModifications.monthlyReturnRate;
                    appliedMods.push(`Ajustou retorno mensal`);
                }

                // Binary search to find exact work years needed
                let low = 0;
                let high = 50; // Maximum 50 years
                let bestYears: number | null = null;
                let bestAge: number | null = null;

                while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    const testProfile = {
                        ...profile,
                        endOfSalaryYears: this.addYearsToDateString(profile.endOfSalaryYears, mid),
                    };

                    const calc = this.calculator.calculateRetirement(testProfile);
                    const depAge = this.getDepletionAge(calc);

                    if (depAge && depAge >= targetAge) {
                        bestYears = mid;
                        bestAge = depAge;
                        high = mid - 1; // Try fewer years
                    } else {
                        low = mid + 1; // Need more years
                    }
                }

                if (bestYears === null) {
                    return JSON.stringify({
                        workYearsNeeded: null,
                        targetAge,
                        currentModifications: appliedMods,
                        achievable: false,
                        description: `Não é possível atingir ${targetAge} anos apenas trabalhando mais tempo. São necessárias outras estratégias (reduzir despesas, vender ativos, etc).`,
                    });
                }

                // If 0 years needed, already meets target
                if (bestYears === 0) {
                    return JSON.stringify({
                        workYearsNeeded: 0,
                        targetAge,
                        currentAge: bestAge,
                        currentModifications: appliedMods,
                        achievable: true,
                        description: appliedMods.length > 0
                            ? `Com as modificações aplicadas (${appliedMods.join(', ')}), você JÁ atinge ${bestAge} anos sem trabalhar mais.`
                            : `Você já atinge ${bestAge} anos com o cenário atual. Não precisa trabalhar mais.`,
                    });
                }

                return JSON.stringify({
                    workYearsNeeded: bestYears,
                    targetAge,
                    finalAge: bestAge,
                    currentModifications: appliedMods,
                    achievable: true,
                    description: appliedMods.length > 0
                        ? `Considerando as modificações (${appliedMods.join(', ')}), você precisaria trabalhar ${bestYears} ano(s) a mais para ter dinheiro até os ${targetAge} anos. Com isso, seu dinheiro duraria até os ${bestAge} anos.`
                        : `Você precisaria trabalhar ${bestYears} ano(s) a mais para ter dinheiro até os ${targetAge} anos. Com isso, seu dinheiro duraria até os ${bestAge} anos.`,
                });
            },
        });
    }

    /**
     * Tool: Find exact expense reduction needed to reach target age
     */
    createFindExpenseReductionForTargetTool() {
        return new DynamicStructuredTool({
            name: 'find_expense_reduction_for_target',
            description: 'Calcula EXATAMENTE quanto % REDUZIR nas despesas mensais para atingir uma idade alvo específica. Use quando o usuário perguntar "quanto preciso economizar para chegar a X anos" ou "qual redução de despesas neste cenário". IMPORTANTE: Se o usuário mencionou modificações anteriores (vendeu ativos, trabalhou mais), passe essas modificações em currentModifications.',
            schema: z.object({
                profileData: z.any().describe('Dados do perfil do usuário'),
                targetAge: z.number().describe('Idade alvo que o usuário quer atingir (ex: 80, 100)'),
                currentModifications: z.object({
                    fixedAssetsSellPercent: z.number().optional().describe('% de ativos fixos já vendidos no cenário'),
                    additionalWorkYears: z.number().optional().describe('Anos adicionais de trabalho já considerados'),
                    monthlyReturnRate: z.number().optional().describe('Nova taxa de retorno se modificada'),
                }).optional().describe('Modificações JÁ APLICADAS no cenário que está sendo discutido'),
            }),
            func: async ({ profileData, targetAge, currentModifications }) => {
                let profile = { ...profileData };
                const appliedMods: string[] = [];

                // Apply current scenario modifications FIRST
                if (currentModifications?.fixedAssetsSellPercent) {
                    const sellAmount = profile.fixedAssets * (currentModifications.fixedAssetsSellPercent / 100);
                    profile.fixedAssets -= sellAmount;
                    appliedMods.push(`Vendeu ${currentModifications.fixedAssetsSellPercent}% dos ativos fixos`);
                }

                if (currentModifications?.additionalWorkYears) {
                    profile.endOfSalaryYears = this.addYearsToDateString(profile.endOfSalaryYears, currentModifications.additionalWorkYears);
                    appliedMods.push(`Trabalhar ${currentModifications.additionalWorkYears} ano(s) a mais`);
                }

                if (currentModifications?.monthlyReturnRate !== undefined) {
                    profile.monthlyReturnRate = currentModifications.monthlyReturnRate;
                    appliedMods.push(`Ajustou retorno mensal`);
                }

                // Binary search to find exact expense reduction needed (0% to 100%)
                let low = 0;
                let high = 100;
                let bestReduction: number | null = null;
                let bestAge: number | null = null;

                const originalRecurring = profile.monthlyExpenseRecurring;
                const originalOneTime = profile.oneTimeAnnualExpense;

                while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    const testProfile = {
                        ...profile,
                        monthlyExpenseRecurring: originalRecurring * (1 - mid / 100),
                        oneTimeAnnualExpense: originalOneTime * (1 - mid / 100),
                    };

                    const calc = this.calculator.calculateRetirement(testProfile);
                    const depAge = this.getDepletionAge(calc);

                    if (depAge && depAge >= targetAge) {
                        bestReduction = mid;
                        bestAge = depAge;
                        high = mid - 1; // Try less reduction
                    } else {
                        low = mid + 1; // Need more reduction
                    }
                }

                if (bestReduction === null) {
                    return JSON.stringify({
                        expenseReductionNeeded: null,
                        targetAge,
                        currentModifications: appliedMods,
                        achievable: false,
                        description: `Não é possível atingir ${targetAge} anos apenas reduzindo despesas. São necessárias outras estratégias (trabalhar mais, vender ativos, etc).`,
                    });
                }

                if (bestReduction === 0) {
                    return JSON.stringify({
                        expenseReductionNeeded: 0,
                        targetAge,
                        currentAge: bestAge,
                        currentModifications: appliedMods,
                        achievable: true,
                        description: appliedMods.length > 0
                            ? `Com as modificações aplicadas (${appliedMods.join(', ')}), você JÁ atinge ${bestAge} anos sem reduzir despesas.`
                            : `Você já atinge ${bestAge} anos com o cenário atual. Não precisa reduzir despesas.`,
                    });
                }

                const totalOriginal = originalRecurring + (originalOneTime / 12);
                const totalNew = originalRecurring * (1 - bestReduction / 100) + (originalOneTime * (1 - bestReduction / 100) / 12);
                const monthlySavings = totalOriginal - totalNew;

                return JSON.stringify({
                    expenseReductionNeeded: bestReduction,
                    targetAge,
                    finalAge: bestAge,
                    monthlySavings: monthlySavings,
                    currentModifications: appliedMods,
                    achievable: true,
                    description: appliedMods.length > 0
                        ? `Considerando as modificações (${appliedMods.join(', ')}), você precisaria reduzir ${bestReduction}% das despesas mensais (economizando R$ ${monthlySavings.toFixed(2)}/mês) para ter dinheiro até os ${targetAge} anos. Com isso, seu dinheiro duraria até os ${bestAge} anos.`
                        : `Você precisaria reduzir ${bestReduction}% das despesas mensais (economizando R$ ${monthlySavings.toFixed(2)}/mês) para ter dinheiro até os ${targetAge} anos. Com isso, seu dinheiro duraria até os ${bestAge} anos.`,
                });
            },
        });
    }

    /**
     * Get all tools
     */
    getAllTools() {
        return [
            this.createWorkLongerTool(),
            this.createReduceExpensesTool(),
            this.createSellAssetsTool(),
            this.createCustomScenarioTool(),
            this.createProfileSummaryTool(),
            this.createBaselineAnalysisTool(),
            this.createFindWorkYearsForTargetTool(),
            this.createFindExpenseReductionForTargetTool(),
        ];
    }
}
