export interface Profile {
  id: number;
  profileName: string;
  lastCalculation?: string;
  startDate?: string;
  baseAge: number;
  totalAssets: number;
  fixedAssets: number;
  monthlySalaryNet: number;
  governmentRetirementIncome: number;
  governmentRetirementStartYears?: string;
  governmentRetirementAdjustment: number;
  monthlyReturnRate: number;
  fixedAssetsGrowthRate: number;
  investmentTaxRate: number;
  investmentTaxablePercentage: number;
  endOfSalaryYears?: string;
  monthlyExpenseRecurring: number;
  oneTimeAnnualExpense: number;
  annualInflation: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCreate {
  profileName: string;
  baseAge: number;
  startDate?: string;
  governmentRetirementStartYears?: string;
  totalAssets: number;
  fixedAssets: number;
  monthlySalaryNet: number;
  governmentRetirementIncome: number;
  governmentRetirementAdjustment: number;
  monthlyReturnRate: number;
  fixedAssetsGrowthRate: number;
  investmentTaxRate: number;
  investmentTaxablePercentage: number;
  endOfSalaryYears?: string;
  monthlyExpenseRecurring: number;
  oneTimeAnnualExpense: number;
  annualInflation: number;
}

export interface ProfileUpdate {
  baseAge?: number;
  startDate?: string;
  governmentRetirementStartYears?: string;
  totalAssets?: number;
  fixedAssets?: number;
  monthlySalaryNet?: number;
  governmentRetirementIncome?: number;
  governmentRetirementAdjustment?: number;
  monthlyReturnRate?: number;
  fixedAssetsGrowthRate?: number;
  investmentTaxRate?: number;
  investmentTaxablePercentage?: number;
  endOfSalaryYears?: string;
  monthlyExpenseRecurring?: number;
  oneTimeAnnualExpense?: number;
  annualInflation?: number;
}

export interface RetirementCalculation {
  profileId: number;
  monthlySavings: number;
  totalRetirementFund: number;
  monthlyRetirementIncome: number;
  yearsToRetirement: number;
  calculationDate: string;
  assumptions: {
    expectedReturnRate: number;
    retirementDurationYears: number;
    inflationRate: number;
    monthlyGrowthUsed?: number;
    monthlyExpenses: number;
    retirementStartDate: string;
    endOfSalaryDate?: string;
    fixedAssetsAtRetirement?: number;
    fixedAssetsGrowthRate?: number;
    timeline?: Array<Record<string, any>>;
    targetAge?: number;
  };
}

export interface CalculationRequest {
  profileId: number;
  expectedReturnRate?: number;
  retirementDurationYears?: number;
  targetAge?: number;
}

export interface ScenarioRequest {
  profileId: number;
  expectedReturnRate?: number;
  retirementDurationYears?: number;
  targetAge?: number;
  startDate?: string;
  totalAssets?: number;
  fixedAssets?: number;
  monthlySalaryNet?: number;
  governmentRetirementIncome?: number;
  monthlyReturnRate?: number;
  fixedAssetsGrowthRate?: number;
  investmentTaxRate?: number;
  investmentTaxablePercentage?: number;
  endOfSalaryYears?: string;
  governmentRetirementStartYears?: string;
  governmentRetirementAdjustment?: number;
  monthlyExpenseRecurring?: number;
  oneTimeAnnualExpense?: number;
  annualInflation?: number;
}

export interface RetirementReadiness {
  readinessScore: number;
  currentSavingsRate: number;
  recommendedSavingsRate: number;
  monthlySavings: number;
  projectedRetirementIncome: number;
  currentMonthlyExpenses: number;
  recommendations: string[];
  calculation: RetirementCalculation;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
