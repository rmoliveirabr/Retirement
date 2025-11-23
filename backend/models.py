from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime

class ProfileBase(BaseModel):
    email: EmailStr
    base_age: int = Field(..., ge=18, le=100, description="Current age")
    # ISO date string for explicit retirement start date (e.g. '2034-01-01')
    start_date: Optional[str] = Field(None, description="Explicit retirement start date in ISO format YYYY-MM-DD")
    total_assets: float = Field(..., ge=0, description="Total current assets")
    fixed_assets: float = Field(..., ge=0, description="Fixed assets (non-liquid)")
    monthly_salary_net: float = Field(..., ge=0, description="Monthly net salary")
    government_retirement_income: float = Field(..., ge=0, description="Expected monthly government pension/retirement income net of taxes")
    monthly_return_rate: float = Field(..., ge=0, le=0.05, description="Monthly portfolio return rate (0-0.05, e.g., 0.005 for 0.5% monthly)")
    fixed_assets_growth_rate: float = Field(0.04, ge=0, le=0.2, description="Annual growth rate for fixed assets (0-0.2, default 4%)")
    investment_tax_rate: float = Field(..., ge=0, le=1, description="Investment tax rate (0-1)")
    investment_taxable_percentage: float = Field(1.0, ge=0, le=1, description="Percentage of investments subject to taxes (0-1)")
    end_of_salary_years: int = Field(..., ge=0, le=50, description="Years until salary ends")
    government_retirement_start_years: int = Field(..., ge=0, le=100, description="Years until government retirement/pension starts")
    government_retirement_adjustment: float = Field(..., ge=0, le=0.1, description="Annual COLA adjustment rate for government retirement income")
    monthly_expense_recurring: float = Field(..., ge=0, description="Monthly recurring expenses")
    rent: float = Field(..., ge=0, description="Monthly rent")
    one_time_annual_expense: float = Field(..., ge=0, description="One-time annual expenses")
    annual_inflation: float = Field(..., ge=0, le=0.2, description="Annual inflation rate (0-0.2)")

    @field_validator('fixed_assets')
    @classmethod
    def fixed_assets_must_not_exceed_total(cls, v: float, info) -> float:
        """Validate that fixed assets don't exceed total assets"""
        if info.data.get('total_assets') is not None and v > info.data['total_assets']:
            raise ValueError('Fixed assets cannot exceed total assets')
        return v

    @field_validator('end_of_salary_years')
    @classmethod
    def validate_salary_timeline(cls, v: int, info) -> int:
        """Validate salary end timeline is reasonable"""
        if v < 0:
            raise ValueError('End of salary years cannot be negative')
        return v

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    base_age: Optional[int] = Field(None, ge=18, le=100)
    start_date: Optional[str] = None
    total_assets: Optional[float] = Field(None, ge=0)
    fixed_assets: Optional[float] = Field(None, ge=0)
    monthly_salary_net: Optional[float] = Field(None, ge=0)
    government_retirement_income: Optional[float] = None
    monthly_return_rate: Optional[float] = Field(None, ge=0, le=0.05)
    fixed_assets_growth_rate: Optional[float] = Field(None, ge=0, le=0.2)
    investment_tax_rate: Optional[float] = Field(None, ge=0, le=1)
    investment_taxable_percentage: Optional[float] = Field(None, ge=0, le=1)
    end_of_salary_years: Optional[int] = Field(None, ge=0, le=50)
    government_retirement_start_years: Optional[int] = Field(None, ge=0, le=100)
    government_retirement_adjustment: Optional[float] = Field(None, ge=0, le=0.1)
    monthly_expense_recurring: Optional[float] = Field(None, ge=0)
    rent: Optional[float] = Field(None, ge=0)
    one_time_annual_expense: Optional[float] = Field(None, ge=0)
    annual_inflation: Optional[float] = Field(None, ge=0, le=0.2)

class Profile(ProfileBase):
    id: int
    last_calculation: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @property
    def years_to_retirement(self) -> int:
        """Calculate years to retirement.

        Priority:
        1. If an explicit `start_date` is provided, compute years from now to that date's year.
        2. Else if `start_of_retirement_years` is provided and > 0, use that.
        3. Otherwise return 0.
        """
        # 1) explicit start_date
        sd = getattr(self, 'start_date', None)
        if sd:
            try:
                yr = datetime.fromisoformat(sd).year
                return max(0, yr - datetime.now().year)
            except Exception:
                pass

        # 2) explicit years
        siy = getattr(self, 'government_retirement_start_years', None)
        if siy is not None:
            try:
                siy_i = int(siy)
                if siy_i > 0:
                    return siy_i
            except Exception:
                pass

        # 3) fallback
        return 0

    class Config:
        from_attributes = True

class RetirementCalculation(BaseModel):
    profile_id: int
    monthly_savings: float
    total_retirement_fund: float
    monthly_retirement_income: float
    years_to_retirement: int
    calculation_date: datetime
    assumptions: dict

class CalculationRequest(BaseModel):
    profile_id: int
    expected_return_rate: float = Field(default=0.07, ge=0, le=0.2, description="Expected annual return rate")
    retirement_duration_years: int = Field(default=25, ge=10, le=50, description="Expected retirement duration")
    target_age: int = Field(default=100, ge=50, le=120, description="Target age to simulate until")

class ScenarioRequest(BaseModel):
    """Request model for scenario calculations with profile overrides"""
    profile_id: int
    expected_return_rate: float = Field(default=0.07, ge=0, le=0.2, description="Expected annual return rate")
    retirement_duration_years: int = Field(default=25, ge=10, le=50, description="Expected retirement duration")
    target_age: int = Field(default=100, ge=50, le=120, description="Target age to simulate until")
    # Optional profile overrides for scenario testing
    total_assets: Optional[float] = None
    fixed_assets: Optional[float] = None
    monthly_salary_net: Optional[float] = None
    government_retirement_income: Optional[float] = None
    monthly_return_rate: Optional[float] = None
    fixed_assets_growth_rate: Optional[float] = None
    investment_tax_rate: Optional[float] = None
    investment_taxable_percentage: Optional[float] = None
    end_of_salary_years: Optional[int] = None
    government_retirement_start_years: Optional[int] = None
    government_retirement_adjustment: Optional[float] = None
    monthly_expense_recurring: Optional[float] = None
    rent: Optional[float] = None
    one_time_annual_expense: Optional[float] = None
    annual_inflation: Optional[float] = None

class AIRequest(BaseModel):
    """
    Model for the request sent to the AI assistant endpoint.
    Includes the user's question, profile parameters,
    and the calculation results (projection rows).
    """
    question: str
    profile: dict
    results: List[dict]
    history: Optional[List[dict]] = None
