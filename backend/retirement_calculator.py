import math
from typing import Dict, Any, List
from datetime import datetime, date, timedelta
from models import Profile, RetirementCalculation


def add_months_to_date(d: date, months: int) -> date:
    # naive month add that keeps day 1 for our uses
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, 28)
    return date(year, month, day)

class RetirementCalculator:
    """
    Service class for retirement calculations
    """
    
    @staticmethod
    def calculate_retirement(profile: Profile, expected_return_rate: float = 0.07, retirement_duration_years: int = 25, target_age: int = 100) -> RetirementCalculation:
        """
        Calculate retirement projections based on profile data
        """
        # Determine years to retirement using the Profile.years_to_retirement property
        years_to_retirement = profile.years_to_retirement

        # base dates
        today = datetime.now().date()
        # Determine timeline_start_date (when retirement planning/self-funded retirement begins)
        # This is when the timeline display starts, NOT when government pension starts
        timeline_start_date = None
        if getattr(profile, 'start_date', None):
            try:
                timeline_start_date = datetime.fromisoformat(profile.start_date).date()
            except Exception:
                timeline_start_date = date(today.year, 1, 1)
        else:
            timeline_start_date = date(today.year, 1, 1)
        
        # Determine government_retirement_start_date (when government pension/retirement income starts)
        government_retirement_start_years = int(getattr(profile, 'government_retirement_start_years', 0))
        government_retirement_start_date = date(timeline_start_date.year + government_retirement_start_years, timeline_start_date.month, timeline_start_date.day)
        
        # For compatibility, retirement_start_date refers to timeline start
        retirement_start_date = timeline_start_date

        # Determine a base year aligned to retirement_start_date so that timeline periods reflect the chosen start month/year
        # When explicit start_date is provided, calculate actual years to retirement from today
        if retirement_start_date:
            # Calculate actual years from today to retirement_start_date
            days_to_retirement = (retirement_start_date - today).days
            actual_years_to_retirement = days_to_retirement / 365.25
            # Use actual years if significantly different from profile years_to_retirement
            if abs(actual_years_to_retirement - years_to_retirement) > 0.5:
                base_year = retirement_start_date.year - int(actual_years_to_retirement)
            else:
                base_year = retirement_start_date.year - years_to_retirement
        else:
            base_year = today.year

        # Salary end date measured from TODAY (not from base_year)
        end_of_salary_date = date(today.year + int(profile.end_of_salary_years), today.month, today.day)

        # Initial investment value (liquid)
        investment = max(0.0, profile.total_assets - profile.fixed_assets)

        # monthly constants
        monthly_expenses_base = profile.monthly_expense_recurring + profile.rent
        monthly_return_rate = profile.monthly_return_rate
        investment_tax_rate = profile.investment_tax_rate
        # Percentage of investments subject to taxes (0..1). Defaults to 1.0 when not provided
        investment_taxable_percentage = float(getattr(profile, 'investment_taxable_percentage', 1.0))
        # Fixed assets growth rate (annual)
        fixed_assets_growth_rate = float(getattr(profile, 'fixed_assets_growth_rate', 0.04))

        # determine monthly growth used for the projection (prefer explicit monthly_return_rate)
        if getattr(profile, 'monthly_return_rate', None) is not None and profile.monthly_return_rate > 0:
            monthly_growth_used = float(profile.monthly_return_rate)
        elif expected_return_rate > 0:
            monthly_growth_used = expected_return_rate / 12.0
        else:
            monthly_growth_used = 0.0

        # timeline list starting at current year and building forward (show pre-retirement salary years)
        timeline: List[Dict[str, Any]] = []

        # starting values at retirement start
        current_value = investment
        # pending tax amount to be paid at the start of the next year
        # taxes are calculated on the gains of the current year and paid in the next year
        pending_tax = 0.0
        
        # Track the fund value at retirement start (Issue #1 fix)
        retirement_start_fund_value = None

        # Build a timeline that includes years until retirement plus the retirement duration
        # projected_monthly_retirement represents GOVERNMENT pension, not self-funded retirement
        projected_monthly_retirement = profile.government_retirement_income

        # We'll simulate year-by-year until one of the stop conditions is met:
        # - final_value < 0 (include the depleted year then stop)
        # - age > 100 (do not include rows where age > 100)
        # Use a safety cap to avoid infinite loops.
        max_years = 200
        y = 0
        # Start timeline at current year (so y=0 => current year)
        while y < max_years:
            # Anchor the period month to retirement_start_date's month and year to base_year
            anchor_month = retirement_start_date.month if retirement_start_date else 1
            year_start = date(base_year + y, anchor_month, 1)
            year_end = date(base_year + y + 1, anchor_month, 1)

            age = profile.base_age + y
            # stop if age exceeds target_age (do not include rows where age > target_age)
            if age > int(target_age):
                break

            # Adjust yearly salary and expenses by inflation
            # Salary applies only if end_of_salary_date not reached (salary end date is exclusive)
            salary_active = year_start < end_of_salary_date

            # Yearly accumulators
            total_expenses_year = 0.0
            total_income_salary_year = 0.0
            total_income_retirement_year = 0.0

            # Calculate years since retirement start for inflation purposes
            current_year = base_year + y
            start_year = retirement_start_date.year if retirement_start_date else base_year
            years_since_retirement_start = max(0, current_year - start_year)
            is_in_retirement = current_year >= start_year

            # monthly loop to compound monthly changes
            monthly_value = current_value
            for m in range(12):
                # month date
                month_date = add_months_to_date(year_start, m)
                
                # For expenses and salary during retirement, use years_since_retirement_start for inflation
                # This makes Year 1 of retirement have baseline values (0 additional inflation)
                inflation_years = years_since_retirement_start if is_in_retirement else y
                monthly_inflation = (1 + profile.annual_inflation) ** (inflation_years + (m / 12.0))

                # monthly expenses adjusted (inflation applied relative to retirement start if retired, else from today)
                monthly_expense = monthly_expenses_base * (1 + profile.annual_inflation) ** inflation_years
                # monthly one-time annual expense spread across months (annual one-time/12)
                monthly_one_time = (profile.one_time_annual_expense * (1 + profile.annual_inflation) ** inflation_years) / 12.0
                total_monthly_expense = monthly_expense + monthly_one_time

                # monthly income: salary if active
                monthly_salary = 0.0
                if salary_active:
                    # salary increases annually by inflation; for months in same year use same annual adjusted salary
                    monthly_salary = profile.monthly_salary_net * (1 + profile.annual_inflation) ** inflation_years

                # retirement income: projected grows each year, but only actually received after retirement_start_date
                # monthly retirement projection for this year (used for projection/growth)
                monthly_retirement_projection = projected_monthly_retirement

                # whether retirement income is actually received this month (government pension)
                # Government pension starts at government_retirement_start_date, not timeline start
                retirement_received = month_date >= government_retirement_start_date
                monthly_retirement_income = monthly_retirement_projection if retirement_received else 0.0


                # monthly net contribution to investment = (salary + retirement_income_if_received) - expenses
                # total incoming this month includes salary + private retirement (if any)
                monthly_net = monthly_salary + monthly_retirement_income - total_monthly_expense

                # apply monthly investment growth using the precomputed monthly_growth_used
                if monthly_growth_used > 0:
                    monthly_value = monthly_value * (1 + monthly_growth_used) + monthly_net
                else:
                    monthly_value = monthly_value + monthly_net

                total_expenses_year += total_monthly_expense
                total_income_salary_year += monthly_salary
                # Track private retirement income in the 'retirement' column
                total_income_retirement_year += monthly_retirement_income

            # final value before applying taxes paid this year (taxes from previous year's gains)
            final_value_before_tax = monthly_value

            # taxes_paid this year are the pending_tax computed from last year's gains (paid in this year)
            taxes_paid = pending_tax

            # subtract taxes_paid from the final value for this year's reported final_value
            final_value = final_value_before_tax - taxes_paid

            # total change in invested value during the year (includes returns + net contributions)
            # we report the change before taxes (so the taxes column shows what will be deducted separately)
            total_to_be_added = final_value_before_tax - current_value
            # raw net cashflow this year (income - expenses) for reporting/comparison
            net_cashflow = total_income_salary_year + total_income_retirement_year - total_expenses_year
            # If you prefer to show the raw net cashflow (income - expenses) instead, use:
            # total_to_be_added = total_income_salary_year + total_income_retirement_year - total_expenses_year
            # To approximate tax on gains, you could subtract tax on the gain portion:
            # gain = final_value - current_value - (total_income_salary_year + total_income_retirement_year - total_expenses_year)
            # tax = max(0.0, gain) * investment_tax_rate
            # total_to_be_added = final_value - current_value - tax

            # Capture retirement start fund value at the BEGINNING of retirement year (Issue #1 fix)
            if current_year == start_year and retirement_start_fund_value is None:
                retirement_start_fund_value = current_value  # Use starting value, not final_value
                # Reset pending_tax at retirement start so Year 1 of timeline shows 0 taxes
                pending_tax = 0.0
            
            # Append to timeline only from retirement_start_date onward
            if is_in_retirement:
                years_since_retirement = current_year - start_year
                # Display period anchored to the retirement_start_date month
                anchor_month = retirement_start_date.month if retirement_start_date else 1
                display_start = date(start_year + years_since_retirement, anchor_month, 1)
                display_end = date(start_year + years_since_retirement + 1, anchor_month, 1)

                timeline.append({
                    "year": years_since_retirement + 1,
                    "age": age,
                    "period": f"{display_start.strftime('%m-%Y')} - {display_end.strftime('%m-%Y')}",
                    "value_invested": round(current_value, 2),
                    "total_expenses": round(total_expenses_year, 2),
                    "total_income_salary": round(total_income_salary_year, 2),
                    "total_income_retirement": round(total_income_retirement_year, 2),
                    "total_to_be_added": round(total_to_be_added, 2),
                    # taxes paid this year (these are taxes on last year's investment gains)
                    "taxes_over_investments": round(taxes_paid, 2),
                    "net_cashflow": round(net_cashflow, 2),
                    "final_value": round(final_value, 2),
                })

            # Compute tax on this year's investment gains (excluding net contributions), to be paid next year
            # gain = (final_value_before_tax - current_value) - net_contributions, where net_contributions = net_cashflow
            gain = final_value_before_tax - current_value - net_cashflow
            tax_this_year = max(0.0, gain) * float(investment_tax_rate) * investment_taxable_percentage

            # Prepare for next year
            current_value = final_value

            # project government retirement monthly amount grows by retirement_adjustment (COLA)
            projected_monthly_retirement = projected_monthly_retirement * (1 + profile.government_retirement_adjustment)

            # set pending tax to be paid next year
            pending_tax = tax_this_year

            # detect depletion (include the depleted year then stop)
            if final_value < 0:
                break

            # increment year index
            y += 1

        # Compute monthly_savings simple (using baseline values)
        monthly_expenses = monthly_expenses_base
        monthly_savings = profile.monthly_salary_net - monthly_expenses

        # Total retirement fund at retirement start (Issue #1 fix)
        total_retirement_fund = retirement_start_fund_value if retirement_start_fund_value is not None else current_value
        
        # Calculate fixed assets value at retirement start (Issue #4 fix)
        fixed_assets_at_retirement = profile.fixed_assets * ((1 + fixed_assets_growth_rate) ** years_to_retirement)

        # Use actual government retirement income from profile (Issue #2 fix)
        # This represents government pension, not total desired retirement income
        monthly_retirement_income = profile.government_retirement_income

        return RetirementCalculation(
            profile_id=profile.id,
            monthly_savings=monthly_savings,
            total_retirement_fund=total_retirement_fund,
            monthly_retirement_income=monthly_retirement_income,
            years_to_retirement=years_to_retirement,
            calculation_date=datetime.now(),
            assumptions={
                "expected_return_rate": expected_return_rate,
                "retirement_duration_years": retirement_duration_years,
                "inflation_rate": profile.annual_inflation,
                "monthly_expenses": monthly_expenses,
                "monthly_growth_used": monthly_growth_used,
                "retirement_start_date": retirement_start_date.isoformat(),
                "end_of_salary_date": end_of_salary_date.isoformat(),
                "timeline": timeline,
                "target_age": int(target_age),
                "fixed_assets_at_retirement": fixed_assets_at_retirement,
                "fixed_assets_growth_rate": fixed_assets_growth_rate,
            }
        )
    
    @staticmethod
    def calculate_required_savings(target_monthly_income: float, years_to_retirement: int, 
                                 expected_return_rate: float = 0.07, inflation_rate: float = 0.03) -> Dict[str, Any]:
        """
        Calculate required monthly savings to achieve target retirement income
        """
        # Adjust target income for inflation
        inflation_adjustment = (1 + inflation_rate) ** years_to_retirement
        target_annual_income = target_monthly_income * 12 * inflation_adjustment
        
        # Calculate required retirement fund (using 4% rule)
        safe_withdrawal_rate = 0.04
        required_fund = target_annual_income / safe_withdrawal_rate
        
        # Calculate required monthly savings
        if expected_return_rate > 0:
            monthly_rate = expected_return_rate / 12
            required_monthly_savings = required_fund / ((((1 + monthly_rate) ** (years_to_retirement * 12)) - 1) / monthly_rate)
        else:
            required_monthly_savings = required_fund / (years_to_retirement * 12)
        
        return {
            "required_monthly_savings": required_monthly_savings,
            "required_retirement_fund": required_fund,
            "target_monthly_income": target_monthly_income,
            "target_annual_income": target_annual_income,
            "years_to_retirement": years_to_retirement,
            "assumptions": {
                "expected_return_rate": expected_return_rate,
                "inflation_rate": inflation_rate,
                "safe_withdrawal_rate": safe_withdrawal_rate
            }
        }
    
    @staticmethod
    def calculate_retirement_readiness(profile: Profile, expected_return_rate: float = 0.07) -> Dict[str, Any]:
        """
        Calculate retirement readiness score and recommendations
        """
        calculation = RetirementCalculator.calculate_retirement(profile, expected_return_rate)
        
        # Calculate current savings rate
        monthly_expenses = profile.monthly_expense_recurring + profile.rent
        monthly_savings = profile.monthly_salary_net - monthly_expenses
        savings_rate = monthly_savings / profile.monthly_salary_net if profile.monthly_salary_net > 0 else 0
        
        # Calculate recommended savings rate (15-20% is generally recommended)
        recommended_savings_rate = 0.15
        
        # Derive coverage metrics from the calculated timeline
        tl = calculation.assumptions.get("timeline", []) or []
        depletion_index = next((i for i, row in enumerate(tl) if (row.get("final_value", 0) < 0)), -1)
        last_index = len(tl) - 1
        # Age when funds deplete or last simulated age
        age_when_deplete = (tl[depletion_index]["age"] if depletion_index >= 0 else (tl[last_index]["age"] if last_index >= 0 else profile.base_age)) if tl else profile.base_age
        # Coverage ratio toward age 100 (from current age)
        needed_years = max(1, 100 - profile.base_age)
        covered_years = max(0, age_when_deplete - profile.base_age)
        coverage_ratio = max(0.0, min(1.0, covered_years / needed_years))

        # Leftover funds at the end (0 if depleted early)
        last_final_value = 0.0
        if tl:
            if depletion_index >= 0:
                last_final_value = 0.0
            else:
                last_final_value = float(tl[last_index].get("final_value", 0.0))
        # Target buffer ~2 years of current expenses
        yearly_expenses_now = (profile.monthly_expense_recurring + profile.rent) * 12.0
        buffer_target = max(1.0, yearly_expenses_now * 2.0)
        leftover_ratio = max(0.0, min(1.0, last_final_value / buffer_target))

        # Calculate readiness score (0-100) - Issue #11 fix with improved formula
        # Emergency fund target: 6 months of expenses
        monthly_expenses_total = profile.monthly_expense_recurring + profile.rent
        emergency_fund_target = max(monthly_expenses_total * 6, 1.0)
        emergency_fund_ratio = min(1.0, profile.total_assets / emergency_fund_target)
        
        readiness_score = (
            min(40.0, max(0.0, (savings_rate / recommended_savings_rate) * 40.0)) +  # Savings rate: 40%
            min(20.0, emergency_fund_ratio * 20.0) +                                    # Emergency fund: 20%
            (coverage_ratio * 30.0) +                                                   # Longevity coverage: 30%
            (leftover_ratio * 10.0)                                                    # End buffer: 10%
        )
        readiness_score = float(min(100.0, max(0.0, readiness_score)))
        
        # Generate recommendations
        recommendations = []
        if savings_rate < recommended_savings_rate:
            recommendations.append("Increase your monthly savings rate to at least 15% of your income")
        if profile.total_assets < profile.monthly_salary_net * 6:
            recommendations.append("Build an emergency fund of 3-6 months of expenses")
        if calculation.monthly_retirement_income < monthly_expenses * 0.8:
            recommendations.append("Consider increasing your retirement savings or working longer")
        if coverage_ratio < 1.0:
            recommendations.append("Funds may not last to age 100—consider reducing expenses, increasing savings, or delaying retirement")
        if leftover_ratio < 0.5 and depletion_index < 0:
            recommendations.append("End-of-horizon reserves are low—aim for a larger buffer (e.g., 2 years of expenses)")
        
        return {
            "readiness_score": readiness_score,
            "current_savings_rate": savings_rate,
            "recommended_savings_rate": recommended_savings_rate,
            "monthly_savings": monthly_savings,
            "projected_retirement_income": calculation.monthly_retirement_income,
            "current_monthly_expenses": monthly_expenses,
            "recommendations": recommendations,
            "calculation": calculation
        }
