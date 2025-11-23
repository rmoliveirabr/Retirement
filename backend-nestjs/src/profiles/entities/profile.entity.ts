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
    endOfSalaryYears: number;
    governmentRetirementStartYears: number;
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

    // 2) explicit years
    if (
        profile.governmentRetirementStartYears !== null &&
        profile.governmentRetirementStartYears !== undefined
    ) {
        const years = parseInt(
            profile.governmentRetirementStartYears.toString(),
            10,
        );
        if (years > 0) {
            return years;
        }
    }

    // 3) fallback
    return 0;
}
