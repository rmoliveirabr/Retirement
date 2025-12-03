export interface Profile {
    id: string;
    email: string;
    baseAge: number;
    startDate?: string;
    totalAssets: number;
    fixedAssets: number;
    monthlySalaryNet: number;
    governmentRetirementIncome: number;
    monthlyReturnRate: number;
    fixedAssetsGrowthRate: number;
    investmentTaxRate: number;
    investmentTaxablePercentage: number;
    endOfSalaryYears?: string;
    governmentRetirementStartYears?: string;
    governmentRetirementAdjustment: number;
    monthlyExpenseRecurring: number;
    rent: number;
    oneTimeAnnualExpense: number;
    annualInflation: number;
    lastCalculation?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export function calculateYearsToRetirement(profile: Profile): number {
    // 1) explicit start_date
    if (profile.startDate) {
        try {
            const year = new Date(profile.startDate).getFullYear();
            return Math.max(0, year - new Date().getFullYear());
        } catch (e) {
            // Invalid date, continue to next option
        }
    }

    // 2) parse governmentRetirementStartYears as MM/YYYY
    if (profile.governmentRetirementStartYears) {
        try {
            const parts = profile.governmentRetirementStartYears.split('/');
            if (parts.length === 2) {
                const year = parseInt(parts[1], 10);
                return Math.max(0, year - new Date().getFullYear());
            }
        } catch (e) {
            // Invalid date format, continue to fallback
        }
    }

    // 3) fallback
    return 0;
}
