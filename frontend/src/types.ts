export interface Profile {
  id: number;
  email: string;
  last_calculation?: string;
  start_date?: string;
  base_age: number;
  // retirement_start_age removed; use start_of_retirement_years instead
  total_assets: number;
  fixed_assets: number;
  monthly_salary_net: number;
  government_retirement_income: number;
  government_retirement_start_years: number;
  government_retirement_adjustment: number;
  monthly_return_rate: number;
  fixed_assets_growth_rate: number;
  investment_tax_rate: number;
  investment_taxable_percentage: number;
  end_of_salary_years: number;
  monthly_expense_recurring: number;
  rent: number;
  one_time_annual_expense: number;
  annual_inflation: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  email: string;
  base_age: number;
  start_date?: string;
  government_retirement_start_years?: number;
  total_assets: number;
  fixed_assets: number;
  monthly_salary_net: number;
  government_retirement_income: number;
  government_retirement_adjustment: number;
  monthly_return_rate: number;
  fixed_assets_growth_rate: number;
  investment_tax_rate: number;
  investment_taxable_percentage: number;
  end_of_salary_years: number;
  monthly_expense_recurring: number;
  rent: number;
  one_time_annual_expense: number;
  annual_inflation: number;
}

export interface ProfileUpdate {
  email?: string;
  base_age?: number;
  start_date?: string;
  government_retirement_start_years?: number;
  total_assets?: number;
  fixed_assets?: number;
  monthly_salary_net?: number;
  government_retirement_income?: number;
  government_retirement_adjustment?: number;
  monthly_return_rate?: number;
  fixed_assets_growth_rate?: number;
  investment_tax_rate?: number;
  investment_taxable_percentage?: number;
  end_of_salary_years?: number;
  monthly_expense_recurring?: number;
  rent?: number;
  one_time_annual_expense?: number;
  annual_inflation?: number;
}

export interface RetirementCalculation {
  profile_id: number;
  monthly_savings: number;
  total_retirement_fund: number;
  monthly_retirement_income: number;
  years_to_retirement: number;
  calculation_date: string;
  assumptions: {
    expected_return_rate: number;
    retirement_duration_years: number;
    inflation_rate: number;
    monthly_growth_used?: number;
    monthly_expenses: number;
    retirement_start_date: string;
    end_of_salary_date?: string;
    fixed_assets_at_retirement?: number;
    fixed_assets_growth_rate?: number;
    timeline?: Array<Record<string, any>>;
    target_age?: number;
  };
}

export interface CalculationRequest {
  profile_id: number;
  expected_return_rate?: number;
  retirement_duration_years?: number;
  target_age?: number;
}

export interface ScenarioRequest {
  profile_id: number;
  expected_return_rate?: number;
  retirement_duration_years?: number;
  target_age?: number;
  // Optional profile overrides
  total_assets?: number;
  fixed_assets?: number;
  monthly_salary_net?: number;
  government_retirement_income?: number;
  monthly_return_rate?: number;
  fixed_assets_growth_rate?: number;
  investment_tax_rate?: number;
  investment_taxable_percentage?: number;
  end_of_salary_years?: number;
  government_retirement_start_years?: number;
  government_retirement_adjustment?: number;
  monthly_expense_recurring?: number;
  rent?: number;
  one_time_annual_expense?: number;
  annual_inflation?: number;
}

export interface RetirementReadiness {
  readiness_score: number;
  current_savings_rate: number;
  recommended_savings_rate: number;
  monthly_savings: number;
  projected_retirement_income: number;
  current_monthly_expenses: number;
  recommendations: string[];
  calculation: RetirementCalculation;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
