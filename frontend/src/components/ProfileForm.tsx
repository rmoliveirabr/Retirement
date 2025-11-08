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
        start_date: getDateDisplay((profile as any).start_date ?? ''),
        base_age: profile.base_age,
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
      setFormData({
        email: '',
        base_age: cloneData.base_age,
        start_date: getDateDisplay(cloneData.start_date ?? ''),
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

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Tem certeza de que deseja fechar sem salvar?'
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

    const processedFormData = { ...formData };
    
    // Convert date from DD/MM/YYYY to YYYY-MM-DD for backend
    if ((processedFormData as any).start_date) {
      const dateStr = (processedFormData as any).start_date;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        (processedFormData as any).start_date = `${year}-${month}-${day}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // If it's neither DD/MM/YYYY nor YYYY-MM-DD, clear it
        (processedFormData as any).start_date = '';
      }
    }

    if (!validateForm()) {
      setFormError('Por favor, corrija os erros destacados abaixo antes de salvar.');
      console.log('ProfileForm submit blocked by validation', { processedFormData, errors });
      return;
    }

    try {
      await onSubmit(processedFormData);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to save profile';
      setFormError(message);
      console.error('ProfileForm submit error', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      if (value === '') {
        newValue = '';
      } else {
        const normalized = value.replace(',', '.');
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
      const handleFirstKey = (evt: KeyboardEvent) => {
        if (evt.key >= '0' && evt.key <= '9') {
          e.target.value = '';
        }
        e.target.removeEventListener('keydown', handleFirstKey);
      };
      e.target.addEventListener('keydown', handleFirstKey, { once: true });
    }
  };

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
  const getDateISO = (displayDate: string): string => {
    if (!displayDate) return '';
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return displayDate; // Return as-is if not complete
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
      return;
    }
    
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
      return;
    }
    
    // Only allow numbers and slash
    if (!/^[0-9/]$/.test(key)) {
      e.preventDefault();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    const oldValue = (formData as any).start_date || '';
    
    // Get only digits from both values
    const oldDigits = oldValue.replace(/\D/g, '');
    const newDigits = value.replace(/\D/g, '');
    
    // If digits haven't changed, user just clicked or moved cursor - don't process
    if (oldDigits === newDigits) {
      return;
    }
    
    const cursorPosition = input.selectionStart || 0;
    
    // Limit to 8 digits
    const limitedDigits = newDigits.slice(0, 8);
    
    // Format as DD/MM/YYYY
    let formatted = limitedDigits;
    if (limitedDigits.length >= 3) {
      formatted = limitedDigits.slice(0, 2) + '/' + limitedDigits.slice(2);
    }
    if (limitedDigits.length >= 5) {
      formatted = limitedDigits.slice(0, 2) + '/' + limitedDigits.slice(2, 4) + '/' + limitedDigits.slice(4);
    }
    
    // Count digits before cursor in the user's input
    let digitsBeforeCursor = 0;
    for (let i = 0; i < cursorPosition && i < value.length; i++) {
      if (/\d/.test(value[i])) {
        digitsBeforeCursor++;
      }
    }
    
    // Find where cursor should be in formatted string (after the Nth digit)
    let newCursorPosition = 0;
    let digitsSeen = 0;
    
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitsSeen++;
        if (digitsSeen === digitsBeforeCursor) {
          // Cursor should be right after this digit
          newCursorPosition = i + 1;
          break;
        }
      }
    }
    
    // If we've seen fewer digits than we want to be after, put cursor at end
    if (digitsSeen < digitsBeforeCursor) {
      newCursorPosition = formatted.length;
    }
    
    // Special case: if cursor was at position 0, keep it at 0
    if (digitsBeforeCursor === 0) {
      newCursorPosition = 0;
    }
    
    setFormData(prev => ({ ...prev, start_date: formatted } as any));
    setHasUnsavedChanges(true);
    
    if (errors.start_date) {
      setErrors(prev => ({ ...prev, start_date: '' }));
    }
    
    // Restore cursor position after React updates
    setTimeout(() => {
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const formatNumberForInput = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    const hasDecimals = Math.abs(amount % 1) > 0;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    
    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // If ISO format (YYYY-MM-DD), convert to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return '';
  };

  const getCurrencyDisplay = (name: string, numericValue: number) => {
    return currencyInput[name] ?? formatNumberForInput(numericValue ?? 0);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatBrazilianCurrencyInput(value);
    const numericValue = parseBrazilianCurrency(formattedValue);
    setCurrencyInput(prev => ({ ...prev, [name]: formattedValue }));

    setFormData(prev => ({ ...prev, [name]: numericValue }));
    setHasUnsavedChanges(true);
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCurrencyBlur = (name: string) => {
    const numericValue = (formData as any)[name] ?? 0;
    setCurrencyInput(prev => ({ ...prev, [name]: formatNumberForInput(numericValue) }));
  };

  const handleCurrencyFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    const current = currencyInput[name] ?? formatNumberForInput((formData as any)[name]);
    if (current === '0' || current === '0,00' || current === '0.00' || current === '') {
      e.target.select();
    }
    const toSet = (current === '0' || current === '0,00' || current === '0.00') ? '' : current;
    setCurrencyInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPercentInput(prev => ({ ...prev, [name]: value }));

    const normalized = value.replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    const clamped = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;

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
    const defaultVal = ('' + ((formData as any)[name] ?? 0) * 100);
    const formattedDefault = isNaN(parseFloat(defaultVal)) ? '' : (parseFloat(defaultVal).toFixed(2).replace('.', ','));
    if (formattedDefault === '0,00' || formattedDefault === '0' || formattedDefault === '') {
      e.target.select();
    }
    const toSet = (formattedDefault === '0,00' || formattedDefault === '0') ? '' : formattedDefault;
    setPercentInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handlePercentageBlur = (name: string) => {
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
          <div>
            <h2>
              {profile ? 'Editar Perfil' : cloneData ? 'Clonar Perfil' : 'Criar Novo Perfil'}
              {hasUnsavedChanges && <span className="unsaved-indicator"> •</span>}
            </h2>
            <p className="profile-form-subtitle">Atualize os detalhes do seu perfil de planejamento de aposentadoria</p>
          </div>
          <button 
            className="close-button" 
            onClick={handleClose}
            title="Fechar (Esc)"
            aria-label="Fechar modal"
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
            <h3>👤 Detalhes do Perfil</h3>
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
                  <label htmlFor="start_date">Data de Início da Aposentadoria</label>
                  <input
                    type="text"
                    id="start_date"
                    name="start_date"
                    value={(formData as any).start_date || ''}
                    onChange={handleDateChange}
                    onKeyDown={handleDateKeyDown}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="base_age">Idade Atual *</label>
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
            <h3>Ativos</h3>
            <p className="section-description">Seus ativos atuais e propriedades</p>
            <div className="form-grid">
              <div className="field-card">
                <div className="form-group">
                  <label htmlFor="total_assets">Ativos Totais (R$)</label>
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
                  <label htmlFor="fixed_assets">Ativos Fixos (R$)</label>
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

                <div className="form-group">
                  <label htmlFor="fixed_assets_growth_rate">Taxa de Crescimento de Ativos Fixos (% anual)</label>
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
            </div>
          </div>

          <div className="form-section">
            <h3>Renda e Despesas</h3>
            <p className="section-description">Suas fontes de renda e despesas mensais</p>
            <div className="form-grid">
              <div className="field-card">
                <h4>Renda</h4>
                <div className="form-group">
                  <label htmlFor="monthly_salary_net">Salário Líquido Mensal (R$)</label>
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
                  <label htmlFor="government_retirement_income">Aposentadoria do Governo (Mensal R$)</label>
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
                <h4>Despesas</h4>
                <div className="form-group">
                  <label htmlFor="monthly_expense_recurring">Despesas Recorrentes Mensais (R$)</label>
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
                  <label htmlFor="rent">Aluguel Mensal (R$)</label>
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
                  <label htmlFor="one_time_annual_expense">Despesas Anuais Únicas (R$)</label>
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
            <h3>📊 Investimento e Estratégia Econômica</h3>
            <div className="form-grid">
              <div className="field-card">
                <h4>Investimento</h4>
                <div className="form-group">
                  <label htmlFor="monthly_return_rate">Taxa de Retorno Mensal (%) - Máx 5%</label>
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
                  <label htmlFor="investment_tax_rate">Imposto sobre Investimento (%)</label>
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
                  <label htmlFor="investment_taxable_percentage">Investimentos Tributáveis (%)</label>
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
                  <label htmlFor="fixed_assets_growth_rate">Taxa de Crescimento de Ativos Fixos (% anual)</label>
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
                <h4>Linha do Tempo</h4>
                <div className="form-group">
                  <label htmlFor="government_retirement_start_years">Início da Aposentadoria do Governo (anos)</label>
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
                  <label htmlFor="end_of_salary_years">Fim do Salário (anos)</label>
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
                <h4>Premissas Econômicas</h4>
                <div className="form-group">
                  <label htmlFor="government_retirement_adjustment">Ajuste da Aposentadoria do Governo (% ao ano)</label>
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
                  <label htmlFor="annual_inflation">Taxa de Inflação Anual (%)</label>
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
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (profile ? 'Atualizar Perfil' : cloneData ? 'Clonar Perfil' : 'Criar Perfil')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
