import React, { useState, useEffect, useCallback } from 'react';
import { Profile, ProfileCreate, ProfileUpdate } from '../types';
import { parseBrazilianCurrency, formatBrazilianCurrencyInput } from '../utils/currency';
import './ProfileForm.css';

interface ProfileFormProps {
  profile?: Profile;
  cloneData?: ProfileCreate;
  onSubmit: (data: ProfileCreate | ProfileUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, cloneData, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<ProfileCreate>({
    email: '',
    base_age: 30,
    start_date: '',
    government_retirement_start_years: 0,
    total_assets: 0,
    fixed_assets: 0,
    monthly_salary_net: 0,
    government_retirement_income: 0,
    monthly_return_rate: 0.005,
    fixed_assets_growth_rate: 0.04,
    investment_tax_rate: 0.15,
    investment_taxable_percentage: 1.0,
    end_of_salary_years: 30,
    government_retirement_adjustment: 0.03,
    monthly_expense_recurring: 0,
    rent: 0,
    one_time_annual_expense: 0,
    annual_inflation: 0.03,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currencyInput, setCurrencyInput] = useState<Record<string, string>>({});
  const [percentInput, setPercentInput] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email,
  start_date: (profile as any).start_date ?? '',
  base_age: profile.base_age,
  // retirement_start_age removed; we surface start_of_retirement_years instead
        total_assets: profile.total_assets,
        fixed_assets: profile.fixed_assets,
        monthly_salary_net: profile.monthly_salary_net,
        government_retirement_income: profile.government_retirement_income,
        monthly_return_rate: profile.monthly_return_rate,
        fixed_assets_growth_rate: profile.fixed_assets_growth_rate || 0.04,
        investment_tax_rate: profile.investment_tax_rate,
        investment_taxable_percentage: (profile as any).investment_taxable_percentage ?? 1.0,
    end_of_salary_years: profile.end_of_salary_years,
    government_retirement_start_years: profile.government_retirement_start_years,
        government_retirement_adjustment: profile.government_retirement_adjustment,
        monthly_expense_recurring: profile.monthly_expense_recurring,
        rent: profile.rent,
        one_time_annual_expense: profile.one_time_annual_expense,
        annual_inflation: profile.annual_inflation,
      });
    } else if (cloneData) {
      // When cloning, use all the cloned data but keep email empty
      setFormData({
        email: '',  // Force empty email for cloned profiles
        base_age: cloneData.base_age,
        start_date: cloneData.start_date ?? '',
        total_assets: cloneData.total_assets,
        fixed_assets: cloneData.fixed_assets,
        monthly_salary_net: cloneData.monthly_salary_net,
        government_retirement_income: cloneData.government_retirement_income,
        monthly_return_rate: cloneData.monthly_return_rate,
        fixed_assets_growth_rate: cloneData.fixed_assets_growth_rate || 0.04,
        investment_tax_rate: cloneData.investment_tax_rate,
        investment_taxable_percentage: cloneData.investment_taxable_percentage ?? 1.0,
        end_of_salary_years: cloneData.end_of_salary_years,
        government_retirement_start_years: cloneData.government_retirement_start_years ?? 0,
        government_retirement_adjustment: cloneData.government_retirement_adjustment,
        monthly_expense_recurring: cloneData.monthly_expense_recurring,
        rent: cloneData.rent,
        one_time_annual_expense: cloneData.one_time_annual_expense,
        annual_inflation: cloneData.annual_inflation,
      });
    }
  }, [profile, cloneData]);

  // Handle escape key to close modal
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (confirmed) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [hasUnsavedChanges, onCancel]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

  const baseAge = typeof formData.base_age === 'string' ? parseInt(formData.base_age || '0', 10) : formData.base_age;
    if (isNaN(baseAge) || baseAge < 18 || baseAge > 100) {
      newErrors.base_age = 'Age must be between 18 and 100';
    }

    if (formData.total_assets < 0) {
      newErrors.total_assets = 'Total assets cannot be negative';
    }

    if (formData.monthly_salary_net < 0) {
      newErrors.monthly_salary_net = 'Monthly net salary cannot be negative';
    }

    if (formData.government_retirement_income < 0) {
      newErrors.government_retirement_income = 'Government retirement income cannot be negative';
    }

    if (formData.monthly_return_rate < 0 || formData.monthly_return_rate > 0.05) {
      newErrors.monthly_return_rate = 'Monthly return rate must be between 0% and 5%';
    }

    if ((formData as any).fixed_assets_growth_rate < 0 || (formData as any).fixed_assets_growth_rate > 0.2) {
      newErrors.fixed_assets_growth_rate = 'Fixed assets growth rate must be between 0% and 20%';
    }

    if (formData.investment_tax_rate < 0 || formData.investment_tax_rate > 1) {
      newErrors.investment_tax_rate = 'Investment tax rate must be between 0% and 100%';
    }

    if ((formData as any).investment_taxable_percentage < 0 || (formData as any).investment_taxable_percentage > 1) {
      newErrors.investment_taxable_percentage = 'Taxable investments % must be between 0% and 100%';
    }

    // Timeline fields
    const eos = Number(formData.end_of_salary_years || 0);
    const sor = Number(formData.government_retirement_start_years || 0);
    if (isNaN(eos) || eos < 0 || eos > 100) {
      newErrors.end_of_salary_years = 'End of salary (years) must be between 0 and 100';
    }
    if (isNaN(sor) || sor < 0 || sor > 100) {
      newErrors.government_retirement_start_years = 'Government retirement start (years) must be between 0 and 100';
    }

    if (formData.government_retirement_adjustment < 0 || formData.government_retirement_adjustment > 0.1) {
      newErrors.government_retirement_adjustment = 'Government retirement adjustment must be between 0% and 10%';
    }

    if (formData.monthly_expense_recurring < 0) {
      newErrors.monthly_expense_recurring = 'Monthly expenses cannot be negative';
    }

    if (formData.rent < 0) {
      newErrors.rent = 'Rent cannot be negative';
    }

    if (formData.one_time_annual_expense < 0) {
      newErrors.one_time_annual_expense = 'One-time annual expense cannot be negative';
    }

    if (formData.annual_inflation < 0 || formData.annual_inflation > 0.2) {
      newErrors.annual_inflation = 'Annual inflation must be between 0% and 20%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) {
      // Provide a clear top-level message so users notice validation failures
      setFormError('Please fix the errors highlighted below before saving.');
      // Log data to console for easier debugging
      // eslint-disable-next-line no-console
      console.log('ProfileForm submit blocked by validation', { formData, errors });
      return;
    }

    try {
      await onSubmit(formData);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to save profile';
      setFormError(message);
      // eslint-disable-next-line no-console
      console.error('ProfileForm submit error', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      // Allow clearing the input so users can delete leading zeros or clear the field
      if (value === '') {
        newValue = '';
      } else {
        // Normalize comma to dot so users can type decimals with comma
        const normalized = value.replace(',', '.');
        // Handle percentage fields - convert from percentage to decimal
        if (name === 'monthly_return_rate' || name === 'investment_tax_rate' || 
            name === 'government_retirement_adjustment' || name === 'annual_inflation' || name === 'investment_taxable_percentage' || name === 'fixed_assets_growth_rate') {
          const parsed = parseFloat(normalized);
          newValue = isNaN(parsed) ? 0 : parsed / 100;
        } else {
          const parsed = parseFloat(normalized);
          newValue = isNaN(parsed) ? 0 : parsed;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    setHasUnsavedChanges(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text if it's zero, so typing replaces it
    if (e.target.value === '0') {
      e.target.select();
      // Also clear on first key press if it's a digit
      const handleFirstKey = (evt: KeyboardEvent) => {
        if (evt.key >= '0' && evt.key <= '9') {
          e.target.value = '';
        }
        e.target.removeEventListener('keydown', handleFirstKey);
      };
      e.target.addEventListener('keydown', handleFirstKey, { once: true });
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatBrazilianCurrencyInput(value);
    const numericValue = parseBrazilianCurrency(formattedValue);
    // Keep the user's formatted input so comma decimals are preserved while typing
    setCurrencyInput(prev => ({ ...prev, [name]: formattedValue }));

    setFormData(prev => ({ ...prev, [name]: numericValue }));
    setHasUnsavedChanges(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatNumberForInput = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    // Use pt-BR number formatting with up to 2 fraction digits
    const hasDecimals = Math.abs(amount % 1) > 0;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencyDisplay = (name: string, numericValue: number) => {
    return currencyInput[name] ?? formatNumberForInput(numericValue ?? 0);
  };

  const handleCurrencyFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    // If there's already a raw value stored, keep it; otherwise populate with current formatted numeric value
    const current = currencyInput[name] ?? formatNumberForInput((formData as any)[name]);
    // Select all text if it's just zeros, so typing replaces it
    if (current === '0' || current === '0,00' || current === '0.00' || current === '') {
      e.target.select();
    }
    const toSet = (current === '0' || current === '0,00' || current === '0.00') ? '' : current;
    setCurrencyInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handleCurrencyBlur = (name: string) => {
    // Normalize the display to a standard formatted representation from the numeric value
    const numericValue = (formData as any)[name] ?? 0;
    setCurrencyInput(prev => ({ ...prev, [name]: formatNumberForInput(numericValue) }));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow comma as decimal separator
    // Keep the raw user input while typing to avoid forcing display changes
    setPercentInput(prev => ({ ...prev, [name]: value }));

    const normalized = value.replace(/,/g, '.');
    // Parse and clamp to 2 decimal places to avoid floating point artifacts
    const parsed = parseFloat(normalized);
    const clamped = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100; // percentage e.g., 4.77

    // Clamp per-field to valid ranges (percentages shown to user):
    // - monthly_return_rate: 0..5
    // - investment_tax_rate & investment_taxable_percentage: 0..100
    // - government_retirement_adjustment: 0..10
    // - annual_inflation: 0..20
    // - fixed_assets_growth_rate: 0..20
    let bounded = clamped;
    if (name === 'monthly_return_rate') {
      bounded = Math.min(Math.max(bounded, 0), 5);
    } else if (name === 'investment_tax_rate' || name === 'investment_taxable_percentage') {
      bounded = Math.min(Math.max(bounded, 0), 100);
    } else if (name === 'government_retirement_adjustment') {
      bounded = Math.min(Math.max(bounded, 0), 10);
    } else if (name === 'annual_inflation' || name === 'fixed_assets_growth_rate') {
      bounded = Math.min(Math.max(bounded, 0), 20);
    }

    const numericValue = bounded / 100;
    setFormData(prev => ({ ...prev, [name]: numericValue } as any));
    setHasUnsavedChanges(true);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePercentageFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    // When focusing, keep the existing raw typed value if present, otherwise populate with formatted value
    const defaultVal = ('' + ((formData as any)[name] ?? 0) * 100);
    const formattedDefault = isNaN(parseFloat(defaultVal)) ? '' : (parseFloat(defaultVal).toFixed(2).replace('.', ','));
    // Select all text if it's just zeros, so typing replaces it
    if (formattedDefault === '0,00' || formattedDefault === '0' || formattedDefault === '') {
      e.target.select();
    }
    // If the field shows just zeros, clear it so typing replaces the zero
    const toSet = (formattedDefault === '0,00' || formattedDefault === '0') ? '' : formattedDefault;
    setPercentInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handlePercentageBlur = (name: string) => {
    // On blur, normalize the display to 2 decimal places
    const numericValue = (formData as any)[name] ?? 0;
    const display = isNaN(numericValue) ? '' : ((numericValue * 100).toFixed(2)).replace('.', ',');
    setPercentInput(prev => ({ ...prev, [name]: display }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="profile-form-container" onClick={handleOverlayClick}>
      <div className="profile-form">
        <div className="profile-form-header">
          <h2>
            {profile ? 'Edit Profile' : cloneData ? 'Clone Profile' : 'Create New Profile'}
            {hasUnsavedChanges && <span className="unsaved-indicator"> •</span>}
          </h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            title="Close (Esc)"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {formError && (
          <div className="form-error-banner">
            <p>{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>👤 Profile Details</h3>
            <div className="form-grid">
              <div className="field-card">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="start_date">Retirement Start Date</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={(formData as any).start_date || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(prev => ({ ...prev, start_date: v } as any));
                      setHasUnsavedChanges(true);
                      if (errors.start_date) setErrors(prev => ({ ...prev, start_date: '' }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="base_age">Current Age *</label>
                  <input
                    type="number"
                    id="base_age"
                    name="base_age"
                    value={formData.base_age}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    min="18"
                    max="100"
                    className={errors.base_age ? 'error' : ''}
                    required
                  />
                  {errors.base_age && <span className="error-message">{errors.base_age}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>💰 Financial Overview</h3>
            <div className="form-grid">
              <div className="field-card">
                <h4>Assets</h4>
                <div className="form-group">
                  <label htmlFor="total_assets">Total Assets (R$)</label>
                  <input
                    type="text"
                    id="total_assets"
                    name="total_assets"
                    value={getCurrencyDisplay('total_assets', formData.total_assets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'total_assets')}
                    onBlur={() => handleCurrencyBlur('total_assets')}
                    placeholder="0,00"
                    className={errors.total_assets ? 'error' : ''}
                  />
                  {errors.total_assets && <span className="error-message">{errors.total_assets}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="fixed_assets">Fixed Assets (R$)</label>
                  <input
                    type="text"
                    id="fixed_assets"
                    name="fixed_assets"
                    value={getCurrencyDisplay('fixed_assets', formData.fixed_assets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'fixed_assets')}
                    onBlur={() => handleCurrencyBlur('fixed_assets')}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="field-card">
                <h4>Income</h4>
                <div className="form-group">
                  <label htmlFor="monthly_salary_net">Monthly Net Salary (R$)</label>
                  <input
                    type="text"
                    id="monthly_salary_net"
                    name="monthly_salary_net"
                    value={getCurrencyDisplay('monthly_salary_net', formData.monthly_salary_net)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthly_salary_net')}
                    onBlur={() => handleCurrencyBlur('monthly_salary_net')}
                    placeholder="0,00"
                    className={errors.monthly_salary_net ? 'error' : ''}
                  />
                  {errors.monthly_salary_net && <span className="error-message">{errors.monthly_salary_net}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="government_retirement_income">Government Pension (Monthly R$)</label>
                  <input
                    type="text"
                    id="government_retirement_income"
                    name="government_retirement_income"
                    value={getCurrencyDisplay('government_retirement_income', formData.government_retirement_income)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'government_retirement_income')}
                    onBlur={() => handleCurrencyBlur('government_retirement_income')}
                    placeholder="0,00"
                    className={errors.government_retirement_income ? 'error' : ''}
                  />
                  {errors.government_retirement_income && <span className="error-message">{errors.government_retirement_income}</span>}
                </div>
              </div>

              <div className="field-card">
                <h4>Expenses</h4>
                <div className="form-group">
                  <label htmlFor="monthly_expense_recurring">Monthly Recurring Expenses (R$)</label>
                  <input
                    type="text"
                    id="monthly_expense_recurring"
                    name="monthly_expense_recurring"
                    value={getCurrencyDisplay('monthly_expense_recurring', formData.monthly_expense_recurring)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthly_expense_recurring')}
                    onBlur={() => handleCurrencyBlur('monthly_expense_recurring')}
                    placeholder="0,00"
                    className={errors.monthly_expense_recurring ? 'error' : ''}
                  />
                  {errors.monthly_expense_recurring && <span className="error-message">{errors.monthly_expense_recurring}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="rent">Monthly Rent (R$)</label>
                  <input
                    type="text"
                    id="rent"
                    name="rent"
                    value={getCurrencyDisplay('rent', formData.rent)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'rent')}
                    onBlur={() => handleCurrencyBlur('rent')}
                    placeholder="0,00"
                    className={errors.rent ? 'error' : ''}
                  />
                  {errors.rent && <span className="error-message">{errors.rent}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="one_time_annual_expense">One-time Annual Expenses (R$)</label>
                  <input
                    type="text"
                    id="one_time_annual_expense"
                    name="one_time_annual_expense"
                    value={getCurrencyDisplay('one_time_annual_expense', formData.one_time_annual_expense)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'one_time_annual_expense')}
                    onBlur={() => handleCurrencyBlur('one_time_annual_expense')}
                    placeholder="0,00"
                    className={errors.one_time_annual_expense ? 'error' : ''}
                  />
                  {errors.one_time_annual_expense && <span className="error-message">{errors.one_time_annual_expense}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📊 Investment & Economic Strategy</h3>
            <div className="form-grid">
              <div className="field-card">
                <h4>Investment</h4>
                <div className="form-group">
                  <label htmlFor="monthly_return_rate">Monthly Return Rate (%) - Max 5%</label>
                  <input
                    type="text"
                    id="monthly_return_rate"
                    name="monthly_return_rate"
                    value={percentInput['monthly_return_rate'] ?? (() => {
                      const v = (formData.monthly_return_rate ?? 0) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'monthly_return_rate')}
                    onBlur={() => handlePercentageBlur('monthly_return_rate')}
                    placeholder="e.g., 0,5 for 0.5% monthly"
                    className={errors.monthly_return_rate ? 'error' : ''}
                  />
                  {errors.monthly_return_rate && <span className="error-message">{errors.monthly_return_rate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="investment_tax_rate">Investment Tax Rate (%)</label>
                  <input
                    type="text"
                    id="investment_tax_rate"
                    name="investment_tax_rate"
                    value={percentInput['investment_tax_rate'] ?? (() => {
                      const v = (formData.investment_tax_rate ?? 0) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'investment_tax_rate')}
                    onBlur={() => handlePercentageBlur('investment_tax_rate')}
                    placeholder="e.g., 15,0 for 15%"
                    className={errors.investment_tax_rate ? 'error' : ''}
                  />
                  {errors.investment_tax_rate && <span className="error-message">{errors.investment_tax_rate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="investment_taxable_percentage">Taxable Investments (%)</label>
                  <input
                    type="text"
                    id="investment_taxable_percentage"
                    name="investment_taxable_percentage"
                    value={percentInput['investment_taxable_percentage'] ?? (() => {
                      const v = ((formData as any).investment_taxable_percentage ?? 1) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'investment_taxable_percentage')}
                    onBlur={() => handlePercentageBlur('investment_taxable_percentage')}
                    placeholder="e.g., 60,0 for 60% taxable"
                    className={errors.investment_taxable_percentage ? 'error' : ''}
                  />
                  {errors.investment_taxable_percentage && <span className="error-message">{errors.investment_taxable_percentage}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="fixed_assets_growth_rate">Fixed Assets Growth Rate (% annual)</label>
                  <input
                    type="text"
                    id="fixed_assets_growth_rate"
                    name="fixed_assets_growth_rate"
                    value={percentInput['fixed_assets_growth_rate'] ?? (() => {
                      const v = ((formData as any).fixed_assets_growth_rate ?? 0.04) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'fixed_assets_growth_rate')}
                    onBlur={() => handlePercentageBlur('fixed_assets_growth_rate')}
                    placeholder="e.g., 4,0 for 4% growth"
                    className={errors.fixed_assets_growth_rate ? 'error' : ''}
                  />
                  {errors.fixed_assets_growth_rate && <span className="error-message">{errors.fixed_assets_growth_rate}</span>}
                </div>
              </div>

              <div className="field-card">
                <h4>Timeline</h4>
                <div className="form-group">
                  <label htmlFor="government_retirement_start_years">Government Pension Start (years from start_date)</label>
                  <input
                    type="number"
                    id="government_retirement_start_years"
                    name="government_retirement_start_years"
                    value={formData.government_retirement_start_years ?? 0}
                    onChange={(e) => {
                      const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setFormData(prev => ({ ...prev, government_retirement_start_years: v }));
                      setHasUnsavedChanges(true);
                      if (errors.government_retirement_start_years) setErrors(prev => ({ ...prev, government_retirement_start_years: '' }));
                    }}
                    onFocus={handleNumberFocus}
                    min={0}
                    max={100}
                    className={errors.government_retirement_start_years ? 'error' : ''}
                  />
                  {errors.government_retirement_start_years && <span className="error-message">{errors.government_retirement_start_years}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="end_of_salary_years">End of Salary (years from now)</label>
                  <input
                    type="number"
                    id="end_of_salary_years"
                    name="end_of_salary_years"
                    value={(formData as any).end_of_salary_years ?? 0}
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setFormData(prev => ({ ...prev, end_of_salary_years: v } as any));
                      setHasUnsavedChanges(true);
                      if (errors.end_of_salary_years) setErrors(prev => ({ ...prev, end_of_salary_years: '' }));
                    }}
                    onFocus={handleNumberFocus}
                    min={0}
                    max={100}
                    className={errors.end_of_salary_years ? 'error' : ''}
                  />
                  {errors.end_of_salary_years && <span className="error-message">{errors.end_of_salary_years}</span>}
                </div>
              </div>

              <div className="field-card">
                <h4>Economic Assumptions</h4>
                <div className="form-group">
                  <label htmlFor="government_retirement_adjustment">Government Pension COLA (% per year)</label>
                  <input
                    type="text"
                    id="government_retirement_adjustment"
                    name="government_retirement_adjustment"
                    value={percentInput['government_retirement_adjustment'] ?? (() => {
                      const v = (formData.government_retirement_adjustment ?? 0) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'government_retirement_adjustment')}
                    onBlur={() => handlePercentageBlur('government_retirement_adjustment')}
                    placeholder="e.g., 4,77 for 4.77%"
                    className={errors.government_retirement_adjustment ? 'error' : ''}
                  />
                  {errors.government_retirement_adjustment && <span className="error-message">{errors.government_retirement_adjustment}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="annual_inflation">Annual Inflation Rate (%)</label>
                  <input
                    type="text"
                    id="annual_inflation"
                    name="annual_inflation"
                    value={percentInput['annual_inflation'] ?? (() => {
                      const v = (formData.annual_inflation ?? 0) * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'annual_inflation')}
                    onBlur={() => handlePercentageBlur('annual_inflation')}
                    placeholder="e.g., 3,0 for 3%"
                    className={errors.annual_inflation ? 'error' : ''}
                  />
                  {errors.annual_inflation && <span className="error-message">{errors.annual_inflation}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : (profile ? 'Update Profile' : cloneData ? 'Clone Profile' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
