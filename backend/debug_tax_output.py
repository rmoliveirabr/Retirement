from models import Profile
from retirement_calculator import RetirementCalculator

# Construct a sample profile
p = Profile(
    id=1,
    email='test@example.com',
    base_age=40,
    start_date=None,
    total_assets=100000.0,
    fixed_assets=20000.0,
    monthly_salary_net=5000.0,
    retirement_net_income=3000.0,
    monthly_return_rate=0.005,  # 0.5% monthly (approx 6% annually)
    fixed_assets_growth_rate=0.04,  # 4% annual growth for fixed assets
    investment_tax_rate=0.15,       # 15% tax on gains
    end_of_salary_years=25,
    start_of_retirement_years=20,
    retirement_adjustment=0.02,
    monthly_expense_recurring=2000.0,
    rent=500.0,
    one_time_annual_expense=1200.0,
    annual_inflation=0.03,
    created_at=None,
    updated_at=None,
)

calc = RetirementCalculator.calculate_retirement(p)

tl = calc.assumptions['timeline']

for row in tl[:10]:
    print(
        f"Year {row['year']}: Invested={row['value_invested']}, Added={row['total_to_be_added']}, TaxesPaid={row.get('taxes_over_investments',0)}, Final={row['final_value']}")
