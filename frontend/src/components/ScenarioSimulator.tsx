import React, { useState, useEffect } from 'react';
import { Profile, ScenarioRequest, RetirementCalculation } from '../types';
import { retirementApi, profileApi } from '../services/api';
import { formatBrazilianCurrencyInput, parseBrazilianCurrency } from '../utils/currency';
import './ScenarioSimulator.css';

interface ScenarioSimulatorProps {
  profile: Profile;
  originalCalculation: RetirementCalculation;
  onScenarioCalculated: (calculation: RetirementCalculation) => void;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  profile,
  originalCalculation,
  onScenarioCalculated,
  onProfileUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Input display states for Brazilian notation
  const [currencyInput, setCurrencyInput] = useState<Record<string, string>>({});
  const [percentInput, setPercentInput] = useState<Record<string, string>>({});
  
  // Scenario parameters (initialized from profile)
  const [scenarioParams, setScenarioParams] = useState<Partial<ScenarioRequest>>({
    total_assets: profile.total_assets,
    fixed_assets: profile.fixed_assets,
    monthly_salary_net: profile.monthly_salary_net,
    government_retirement_income: profile.government_retirement_income,
    monthly_return_rate: profile.monthly_return_rate,
    fixed_assets_growth_rate: profile.fixed_assets_growth_rate,
    investment_tax_rate: profile.investment_tax_rate,
    end_of_salary_years: profile.end_of_salary_years,
    government_retirement_start_years: profile.government_retirement_start_years,
    monthly_expense_recurring: profile.monthly_expense_recurring,
    rent: profile.rent,
    one_time_annual_expense: profile.one_time_annual_expense,
    annual_inflation: profile.annual_inflation,
  });

  // Reset scenario when profile changes
  useEffect(() => {
    setScenarioParams({
      total_assets: profile.total_assets,
      fixed_assets: profile.fixed_assets,
      monthly_salary_net: profile.monthly_salary_net,
      government_retirement_income: profile.government_retirement_income,
      monthly_return_rate: profile.monthly_return_rate,
      fixed_assets_growth_rate: profile.fixed_assets_growth_rate,
      investment_tax_rate: profile.investment_tax_rate,
      end_of_salary_years: profile.end_of_salary_years,
      government_retirement_start_years: profile.government_retirement_start_years,
      monthly_expense_recurring: profile.monthly_expense_recurring,
      rent: profile.rent,
      one_time_annual_expense: profile.one_time_annual_expense,
      annual_inflation: profile.annual_inflation,
    });
    setCurrencyInput({});
    setPercentInput({});
    setHasChanges(false);
  }, [profile]);

  const handleCurrencyChange = (field: string, value: string) => {
    const formattedValue = formatBrazilianCurrencyInput(value);
    const numericValue = parseBrazilianCurrency(formattedValue);
    setCurrencyInput(prev => ({ ...prev, [field]: formattedValue }));
    setScenarioParams(prev => ({ ...prev, [field]: numericValue }));
    setHasChanges(true);
  };

  const handlePercentageChange = (field: string, value: string) => {
    setPercentInput(prev => ({ ...prev, [field]: value }));
    const normalized = value.replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    const clamped = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    
    // Clamp to valid ranges
    let bounded = clamped;
    if (field === 'monthly_return_rate') {
      bounded = Math.min(Math.max(bounded, 0), 5);
    } else if (field === 'investment_tax_rate') {
      bounded = Math.min(Math.max(bounded, 0), 100);
    } else if (field === 'fixed_assets_growth_rate' || field === 'annual_inflation') {
      bounded = Math.min(Math.max(bounded, 0), 20);
    }
    
    const numericValue = bounded / 100;
    setScenarioParams(prev => ({ ...prev, [field]: numericValue }));
    setHasChanges(true);
  };

  const handleIntegerChange = (field: string, value: string) => {
    const parsed = parseInt(value) || 0;
    setScenarioParams(prev => ({ ...prev, [field]: parsed }));
    setHasChanges(true);
  };

  const handleIntegerFocus = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    // Select all text if it's zero, so typing replaces it
    if (e.target.value === '0') {
      e.target.select();
      // Also clear on first key press if it's a digit
      const handleFirstKey = (evt: KeyboardEvent) => {
        if (evt.key >= '0' && evt.key <= '9') {
          e.target.value = '';
          // Update state to empty so React is in sync
          setScenarioParams(prev => ({ ...prev, [field]: '' as any }));
        }
        e.target.removeEventListener('keydown', handleFirstKey);
      };
      e.target.addEventListener('keydown', handleFirstKey, { once: true });
    }
  };

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const request: ScenarioRequest = {
        profile_id: profile.id,
        expected_return_rate: originalCalculation.assumptions.expected_return_rate,
        retirement_duration_years: originalCalculation.assumptions.retirement_duration_years,
        target_age: originalCalculation.assumptions.target_age || 100,
        ...scenarioParams,
      };

      const calculation = await retirementApi.calculateScenario(request);
      onScenarioCalculated(calculation);
    } catch (error) {
      console.error('Error calculating scenario:', error);
      setErrorMessage('Failed to calculate scenario. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveToProfile = async () => {
    setIsSaving(true);
    setShowConfirmModal(false);
    try {
      // Build update object with only changed values
      const updates: any = {};
      Object.entries(scenarioParams).forEach(([key, value]) => {
        if (value !== undefined && value !== (profile as any)[key]) {
          updates[key] = value;
        }
      });

      const updatedProfile = await profileApi.update(profile.id, updates);
      onProfileUpdate(updatedProfile);
      setHasChanges(false);
      setShowSuccessModal(true);
      
      // Recalculate with the updated profile
      await handleRecalculate();
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleReset = () => {
    setScenarioParams({
      total_assets: profile.total_assets,
      fixed_assets: profile.fixed_assets,
      monthly_salary_net: profile.monthly_salary_net,
      government_retirement_income: profile.government_retirement_income,
      monthly_return_rate: profile.monthly_return_rate,
      fixed_assets_growth_rate: profile.fixed_assets_growth_rate,
      investment_tax_rate: profile.investment_tax_rate,
      end_of_salary_years: profile.end_of_salary_years,
      government_retirement_start_years: profile.government_retirement_start_years,
      monthly_expense_recurring: profile.monthly_expense_recurring,
      rent: profile.rent,
      one_time_annual_expense: profile.one_time_annual_expense,
      annual_inflation: profile.annual_inflation,
    });
    setCurrencyInput({});
    setPercentInput({});
    setHasChanges(false);
  };

  const formatNumberForInput = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    const hasDecimals = Math.abs(amount % 1) > 0;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencyDisplay = (field: string) => {
    if (currencyInput[field] !== undefined) return currencyInput[field];
    const value = scenarioParams[field as keyof typeof scenarioParams] as number;
    return formatNumberForInput(value ?? 0);
  };

  const getPercentDisplay = (field: string) => {
    if (percentInput[field] !== undefined) return percentInput[field];
    const value = (scenarioParams[field as keyof typeof scenarioParams] as number) ?? 0;
    return (value * 100).toFixed(2).replace('.', ',');
  };

  const handleCurrencyFocus = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    const current = getCurrencyDisplay(field);
    // Select all text if it's just zeros, so typing replaces it
    if (current === '0' || current === '0,00' || current === '0.00' || current === '') {
      e.target.select();
    }
    const toSet = (current === '0' || current === '0,00' || current === '0.00') ? '' : current;
    setCurrencyInput(prev => ({ ...prev, [field]: toSet }));
  };

  const handleCurrencyBlur = (field: string) => {
    const numericValue = scenarioParams[field as keyof typeof scenarioParams] as number ?? 0;
    setCurrencyInput(prev => ({ ...prev, [field]: formatNumberForInput(numericValue) }));
  };

  const handlePercentFocus = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    const current = getPercentDisplay(field);
    // Select all text if it's just zeros, so typing replaces it
    if (current === '0,00' || current === '0' || current === '') {
      e.target.select();
    }
    const toSet = (current === '0,00' || current === '0') ? '' : current;
    setPercentInput(prev => ({ ...prev, [field]: toSet }));
  };

  const handlePercentBlur = (field: string) => {
    const numericValue = scenarioParams[field as keyof typeof scenarioParams] as number ?? 0;
    setPercentInput(prev => ({ ...prev, [field]: (numericValue * 100).toFixed(2).replace('.', ',') }));
  };

  return (
    <div className="scenario-simulator">
      <div className="scenario-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🔮 Scenario Simulator</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="scenario-content">
          <p className="scenario-description">
            Adjust parameters below to explore different scenarios. Changes won't affect your profile until you save them.
          </p>

          <div className="scenario-grid">
            {/* Assets Section */}
            <div className="scenario-section">
              <h4>💰 Assets</h4>
              <div className="param-field">
                <label>Total Assets (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('total_assets')}
                  onChange={(e) => handleCurrencyChange('total_assets', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'total_assets')}
                  onBlur={() => handleCurrencyBlur('total_assets')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>Fixed Assets (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('fixed_assets')}
                  onChange={(e) => handleCurrencyChange('fixed_assets', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'fixed_assets')}
                  onBlur={() => handleCurrencyBlur('fixed_assets')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>Fixed Assets Growth Rate (%/year)</label>
                <input
                  type="text"
                  value={getPercentDisplay('fixed_assets_growth_rate')}
                  onChange={(e) => handlePercentageChange('fixed_assets_growth_rate', e.target.value)}
                  onFocus={(e) => handlePercentFocus(e, 'fixed_assets_growth_rate')}
                  onBlur={() => handlePercentBlur('fixed_assets_growth_rate')}
                  placeholder="4,00"
                />
              </div>
            </div>

            {/* Income Section */}
            <div className="scenario-section">
              <h4>💵 Income</h4>
              <div className="param-field">
                <label>Monthly Salary (Net) (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('monthly_salary_net')}
                  onChange={(e) => handleCurrencyChange('monthly_salary_net', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'monthly_salary_net')}
                  onBlur={() => handleCurrencyBlur('monthly_salary_net')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>Government Retirement Income (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('government_retirement_income')}
                  onChange={(e) => handleCurrencyChange('government_retirement_income', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'government_retirement_income')}
                  onBlur={() => handleCurrencyBlur('government_retirement_income')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>Years Until Salary Ends</label>
                <input
                  type="number"
                  value={scenarioParams.end_of_salary_years ?? ''}
                  onChange={(e) => handleIntegerChange('end_of_salary_years', e.target.value)}
                  onFocus={(e) => handleIntegerFocus(e, 'end_of_salary_years')}
                  placeholder="0"
                />
              </div>
              <div className="param-field">
                <label>Years Until Gov. Retirement</label>
                <input
                  type="number"
                  value={scenarioParams.government_retirement_start_years ?? ''}
                  onChange={(e) => handleIntegerChange('government_retirement_start_years', e.target.value)}
                  onFocus={(e) => handleIntegerFocus(e, 'government_retirement_start_years')}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Expenses Section */}
            <div className="scenario-section">
              <h4>💸 Expenses</h4>
              <div className="param-field">
                <label>Monthly Recurring Expenses (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('monthly_expense_recurring')}
                  onChange={(e) => handleCurrencyChange('monthly_expense_recurring', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'monthly_expense_recurring')}
                  onBlur={() => handleCurrencyBlur('monthly_expense_recurring')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>Monthly Rent (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('rent')}
                  onChange={(e) => handleCurrencyChange('rent', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'rent')}
                  onBlur={() => handleCurrencyBlur('rent')}
                  placeholder="0,00"
                />
              </div>
              <div className="param-field">
                <label>One-time Annual Expense (R$)</label>
                <input
                  type="text"
                  value={getCurrencyDisplay('one_time_annual_expense')}
                  onChange={(e) => handleCurrencyChange('one_time_annual_expense', e.target.value)}
                  onFocus={(e) => handleCurrencyFocus(e, 'one_time_annual_expense')}
                  onBlur={() => handleCurrencyBlur('one_time_annual_expense')}
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Rates Section */}
            <div className="scenario-section">
              <h4>📊 Rates</h4>
              <div className="param-field">
                <label>Monthly Return Rate (%)</label>
                <input
                  type="text"
                  value={getPercentDisplay('monthly_return_rate')}
                  onChange={(e) => handlePercentageChange('monthly_return_rate', e.target.value)}
                  onFocus={(e) => handlePercentFocus(e, 'monthly_return_rate')}
                  onBlur={() => handlePercentBlur('monthly_return_rate')}
                  placeholder="0,50"
                />
              </div>
              <div className="param-field">
                <label>Investment Tax Rate (%)</label>
                <input
                  type="text"
                  value={getPercentDisplay('investment_tax_rate')}
                  onChange={(e) => handlePercentageChange('investment_tax_rate', e.target.value)}
                  onFocus={(e) => handlePercentFocus(e, 'investment_tax_rate')}
                  onBlur={() => handlePercentBlur('investment_tax_rate')}
                  placeholder="15,00"
                />
              </div>
              <div className="param-field">
                <label>Annual Inflation (%)</label>
                <input
                  type="text"
                  value={getPercentDisplay('annual_inflation')}
                  onChange={(e) => handlePercentageChange('annual_inflation', e.target.value)}
                  onFocus={(e) => handlePercentFocus(e, 'annual_inflation')}
                  onBlur={() => handlePercentBlur('annual_inflation')}
                  placeholder="3,00"
                />
              </div>
            </div>
          </div>

          <div className="scenario-actions">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={!hasChanges || isCalculating || isSaving}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRecalculate}
              disabled={!hasChanges || isCalculating || isSaving}
            >
              {isCalculating ? 'Calculating...' : 'Recalculate'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleSaveClick}
              disabled={!hasChanges || isCalculating || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Save</h3>
            <p>Save these scenario parameters to your profile?</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveToProfile}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">✓</div>
            <h3>Success!</h3>
            <p>Profile updated successfully and calculations refreshed.</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon error">✕</div>
            <h3>Error</h3>
            <p>{errorMessage}</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioSimulator;
