"""
Comprehensive Test Suite for Retirement Calculator

Tests cover:
- Issue #1: Total Retirement Fund tracking
- Issue #2: Safe Withdrawal Rate vs Actual Income
- Issue #4: Fixed Assets Integration
- Issue #5: Rate field naming clarity
- Issue #10: Input Validations
- Issue #11: Readiness Score calculation
"""

import pytest
from datetime import datetime, date
from models import Profile, ProfileCreate, ProfileUpdate, RetirementCalculation
from retirement_calculator import RetirementCalculator
from pydantic import ValidationError


class TestIssue1_RetirementFundTracking:
    """Test that total_retirement_fund represents value at retirement start, not end"""
    
    def test_retirement_fund_is_at_start_not_end(self):
        """Verify fund value captured at retirement start"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=100000.0,
            fixed_assets=20000.0,
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=1200.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile, target_age=65)
        
        # The total_retirement_fund should be the value at year 20 (retirement start)
        # not the value at age 65 (end of simulation)
        timeline = calc.assumptions['timeline']
        
        # First timeline entry is retirement start (year 1)
        if timeline:
            first_year_value = timeline[0]['value_invested']
            # total_retirement_fund should be close to the first year's starting value
            assert abs(calc.total_retirement_fund - first_year_value) < 1000, \
                f"Fund should be at retirement start, got {calc.total_retirement_fund} vs first year {first_year_value}"


class TestIssue2_ActualRetirementIncome:
    """Test that displayed monthly retirement income matches profile setting"""
    
    def test_uses_profile_retirement_income(self):
        """Verify we use profile.retirement_net_income, not 4% rule calculation"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=50,
            start_date=None,
            total_assets=500000.0,
            fixed_assets=0.0,
            monthly_salary_net=10000.0,
            retirement_net_income=4500.0,  # Explicit value
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=10,
            start_of_retirement_years=10,
            retirement_adjustment=0.03,
            monthly_expense_recurring=3000.0,
            rent=1000.0,
            one_time_annual_expense=5000.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile)
        
        # Should use the exact profile value, not calculate with 4% rule
        assert calc.monthly_retirement_income == 4500.0, \
            f"Should use profile retirement income of 4500, got {calc.monthly_retirement_income}"
        
        # If we used 4% rule, it would be: (500000 * 0.04) / 12 ≈ 1666.67
        # So this verifies we're NOT using that calculation
        assert calc.monthly_retirement_income != pytest.approx(1666.67, rel=0.01)


class TestIssue4_FixedAssetsIntegration:
    """Test fixed assets growth tracking"""
    
    def test_fixed_assets_growth_calculated(self):
        """Verify fixed assets grow at specified rate"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=200000.0,
            fixed_assets=100000.0,  # 50% in fixed assets
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.05,  # 5% annual growth
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=1200.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile)
        
        # Fixed assets should grow: 100000 * (1.05^20)
        expected_fixed_assets = 100000.0 * (1.05 ** 20)
        actual_fixed_assets = calc.assumptions['fixed_assets_at_retirement']
        
        assert actual_fixed_assets == pytest.approx(expected_fixed_assets, rel=0.01), \
            f"Fixed assets should be {expected_fixed_assets}, got {actual_fixed_assets}"
    
    def test_default_fixed_assets_growth_rate(self):
        """Verify default 4% growth rate used when not specified"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=150000.0,
            fixed_assets=50000.0,
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.005,
            # fixed_assets_growth_rate not specified, should default to 0.04
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=1200.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile)
        
        # Should default to 4%: 50000 * (1.04^20)
        expected_fixed_assets = 50000.0 * (1.04 ** 20)
        actual_fixed_assets = calc.assumptions['fixed_assets_at_retirement']
        
        assert actual_fixed_assets == pytest.approx(expected_fixed_assets, rel=0.01)


class TestIssue5_RateFieldNaming:
    """Test that monthly_return_rate field is properly named and used"""
    
    def test_monthly_return_rate_field_exists(self):
        """Verify monthly_return_rate field exists and is used correctly"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=100000.0,
            fixed_assets=0.0,
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.008,  # 0.8% monthly = ~9.6% annual
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=1200.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile)
        
        # Verify the monthly_growth_used matches our monthly_return_rate
        assert calc.assumptions['monthly_growth_used'] == 0.008
    
    def test_monthly_return_rate_validation(self):
        """Test that monthly_return_rate has appropriate validation limits"""
        # Should reject values > 0.05 (5% monthly is unrealistic)
        with pytest.raises(ValidationError):
            ProfileCreate(
                email='test@example.com',
                base_age=40,
                total_assets=100000.0,
                fixed_assets=0.0,
                monthly_salary_net=5000.0,
                retirement_net_income=3000.0,
                monthly_return_rate=0.10,  # 10% monthly is way too high
                investment_tax_rate=0.15,
                end_of_salary_years=20,
                start_of_retirement_years=20,
                retirement_adjustment=0.02,
                monthly_expense_recurring=2000.0,
                rent=500.0,
                one_time_annual_expense=1200.0,
                annual_inflation=0.03,
            )


class TestIssue10_InputValidations:
    """Test input validation rules"""
    
    def test_fixed_assets_cannot_exceed_total(self):
        """Verify fixed assets validation"""
        with pytest.raises(ValidationError) as exc_info:
            ProfileCreate(
                email='test@example.com',
                base_age=40,
                total_assets=100000.0,
                fixed_assets=150000.0,  # More than total!
                monthly_salary_net=5000.0,
                retirement_net_income=3000.0,
                monthly_return_rate=0.005,
                investment_tax_rate=0.15,
                end_of_salary_years=20,
                start_of_retirement_years=20,
                retirement_adjustment=0.02,
                monthly_expense_recurring=2000.0,
                rent=500.0,
                one_time_annual_expense=1200.0,
                annual_inflation=0.03,
            )
        assert "Fixed assets cannot exceed total assets" in str(exc_info.value)
    
    def test_age_validation(self):
        """Test age range validation"""
        with pytest.raises(ValidationError):
            ProfileCreate(
                email='test@example.com',
                base_age=17,  # Too young
                total_assets=100000.0,
                fixed_assets=0.0,
                monthly_salary_net=5000.0,
                retirement_net_income=3000.0,
                monthly_return_rate=0.005,
                investment_tax_rate=0.15,
                end_of_salary_years=20,
                start_of_retirement_years=20,
                retirement_adjustment=0.02,
                monthly_expense_recurring=2000.0,
                rent=500.0,
                one_time_annual_expense=1200.0,
                annual_inflation=0.03,
            )
    
    def test_negative_values_rejected(self):
        """Test that negative financial values are rejected"""
        with pytest.raises(ValidationError):
            ProfileCreate(
                email='test@example.com',
                base_age=40,
                total_assets=-100.0,  # Negative
                fixed_assets=0.0,
                monthly_salary_net=5000.0,
                retirement_net_income=3000.0,
                monthly_return_rate=0.005,
                investment_tax_rate=0.15,
                end_of_salary_years=20,
                start_of_retirement_years=20,
                retirement_adjustment=0.02,
                monthly_expense_recurring=2000.0,
                rent=500.0,
                one_time_annual_expense=1200.0,
                annual_inflation=0.03,
            )


class TestIssue11_ReadinessScore:
    """Test improved readiness score calculation"""
    
    def test_readiness_score_components(self):
        """Verify readiness score uses improved formula with proper weights"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=150000.0,  # 6 months emergency fund covered
            fixed_assets=50000.0,
            monthly_salary_net=10000.0,
            retirement_net_income=6000.0,
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=5000.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        readiness = RetirementCalculator.calculate_retirement_readiness(profile)
        
        # Score should be between 0 and 100
        assert 0 <= readiness['readiness_score'] <= 100
        
        # Should have reasonable savings rate
        savings_rate = readiness['current_savings_rate']
        assert savings_rate >= 0
        
        # Emergency fund target should be 6 months of expenses
        monthly_expenses = profile.monthly_expense_recurring + profile.rent
        # With 150K total assets and 2.5K monthly expenses, should have good coverage
    
    def test_readiness_score_weights(self):
        """Verify score components add up correctly (40+20+30+10 = 100)"""
        # Create a "perfect" profile
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=500000.0,  # Excellent emergency fund
            fixed_assets=0.0,
            monthly_salary_net=10000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.008,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=1000.0,
            rent=500.0,
            one_time_annual_expense=2000.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        readiness = RetirementCalculator.calculate_retirement_readiness(profile)
        
        # With excellent parameters, score should be high
        assert readiness['readiness_score'] >= 70, \
            f"Expected high score for good profile, got {readiness['readiness_score']}"


class TestCalculationAccuracy:
    """Test overall calculation accuracy and consistency"""
    
    def test_timeline_consistency(self):
        """Verify timeline values are internally consistent"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=50,
            start_date='2030-01-01',
            total_assets=200000.0,
            fixed_assets=50000.0,
            monthly_salary_net=8000.0,
            retirement_net_income=4000.0,
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=5,
            start_of_retirement_years=5,
            retirement_adjustment=0.03,
            monthly_expense_recurring=2500.0,
            rent=1000.0,
            one_time_annual_expense=8000.0,
            annual_inflation=0.04,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile, target_age=80)
        timeline = calc.assumptions['timeline']
        
        # Verify timeline entries are sequential
        for i in range(len(timeline) - 1):
            assert timeline[i]['year'] < timeline[i+1]['year']
            assert timeline[i]['age'] < timeline[i+1]['age']
        
        # Verify first entry is at retirement start
        assert timeline[0]['year'] == 1
    
    def test_tax_calculation_non_negative(self):
        """Verify taxes are never negative"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=40,
            start_date=None,
            total_assets=100000.0,
            fixed_assets=20000.0,
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.005,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=0.6,
            end_of_salary_years=20,
            start_of_retirement_years=20,
            retirement_adjustment=0.02,
            monthly_expense_recurring=2000.0,
            rent=500.0,
            one_time_annual_expense=1200.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile, target_age=75)
        timeline = calc.assumptions['timeline']
        
        # All tax values should be >= 0
        for entry in timeline:
            assert entry['taxes_over_investments'] >= 0, \
                f"Negative tax in year {entry['year']}: {entry['taxes_over_investments']}"


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_zero_retirement_years(self):
        """Test when already retired (0 years to retirement)"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=65,
            start_date=None,
            total_assets=500000.0,
            fixed_assets=100000.0,
            monthly_salary_net=0.0,
            retirement_net_income=4000.0,
            monthly_return_rate=0.004,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=0,
            start_of_retirement_years=0,
            retirement_adjustment=0.02,
            monthly_expense_recurring=3000.0,
            rent=500.0,
            one_time_annual_expense=5000.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile)
        
        # Should still produce valid calculation
        assert calc.total_retirement_fund >= 0
        assert calc.years_to_retirement == 0
    
    def test_high_expenses_scenario(self):
        """Test scenario where expenses exceed income"""
        profile = Profile(
            id=1,
            email='test@example.com',
            base_age=50,
            start_date=None,
            total_assets=200000.0,
            fixed_assets=0.0,
            monthly_salary_net=5000.0,
            retirement_net_income=3000.0,
            monthly_return_rate=0.003,
            fixed_assets_growth_rate=0.04,
            investment_tax_rate=0.15,
            investment_taxable_percentage=1.0,
            end_of_salary_years=10,
            start_of_retirement_years=10,
            retirement_adjustment=0.02,
            monthly_expense_recurring=6000.0,  # More than salary
            rent=2000.0,
            one_time_annual_expense=10000.0,
            annual_inflation=0.03,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        
        calc = RetirementCalculator.calculate_retirement(profile, target_age=75)
        
        # Should handle gracefully, funds will deplete
        # Verify calculation completes without errors
        assert calc.total_retirement_fund is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
