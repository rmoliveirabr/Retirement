import React, { useState, useEffect, useCallback } from 'react';
import { Profile, ProfileCreate, ProfileUpdate } from '../types';
import { parseBrazilianCurrency, formatBrazilianCurrencyInput } from '../utils/currency';
import AiInfoButton from './AiInfoButton';
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
    profileName: '',
    email: '',
    baseAge: 30,
    startDate: '',
    governmentRetirementStartYears: 0,
    totalAssets: 0,
    fixedAssets: 0,
    monthlySalaryNet: 0,
    governmentRetirementIncome: 8157.41,
    monthlyReturnRate: 0.005,
    fixedAssetsGrowthRate: 0.04,
    investmentTaxRate: 0.15,
    investmentTaxablePercentage: 1.0,
    endOfSalaryYears: 30,
    governmentRetirementAdjustment: 0.03,
    monthlyExpenseRecurring: 0,
    rent: 0,
    oneTimeAnnualExpense: 0,
    annualInflation: 0.03,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currencyInput, setCurrencyInput] = useState<Record<string, string>>({});
  const [percentInput, setPercentInput] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        profileName: profile.profileName,
        email: profile.email,
        startDate: getDateDisplay(profile.startDate ?? ''),
        baseAge: profile.baseAge,
        totalAssets: profile.totalAssets,
        fixedAssets: profile.fixedAssets,
        monthlySalaryNet: profile.monthlySalaryNet,
        governmentRetirementIncome: profile.governmentRetirementIncome,
        monthlyReturnRate: profile.monthlyReturnRate,
        fixedAssetsGrowthRate: profile.fixedAssetsGrowthRate || 0.04,
        investmentTaxRate: profile.investmentTaxRate,
        investmentTaxablePercentage: profile.investmentTaxablePercentage ?? 1.0,
        endOfSalaryYears: profile.endOfSalaryYears,
        governmentRetirementStartYears: profile.governmentRetirementStartYears,
        governmentRetirementAdjustment: profile.governmentRetirementAdjustment,
        monthlyExpenseRecurring: profile.monthlyExpenseRecurring,
        rent: profile.rent,
        oneTimeAnnualExpense: profile.oneTimeAnnualExpense,
        annualInflation: profile.annualInflation,
      });
    } else if (cloneData) {
      setFormData({
        profileName: cloneData.profileName + ' (Copy)',
        email: '',
        baseAge: cloneData.baseAge,
        startDate: getDateDisplay(cloneData.startDate ?? ''),
        totalAssets: cloneData.totalAssets,
        fixedAssets: cloneData.fixedAssets,
        monthlySalaryNet: cloneData.monthlySalaryNet,
        governmentRetirementIncome: cloneData.governmentRetirementIncome,
        monthlyReturnRate: cloneData.monthlyReturnRate,
        fixedAssetsGrowthRate: cloneData.fixedAssetsGrowthRate || 0.04,
        investmentTaxRate: cloneData.investmentTaxRate,
        investmentTaxablePercentage: cloneData.investmentTaxablePercentage ?? 1.0,
        endOfSalaryYears: cloneData.endOfSalaryYears,
        governmentRetirementStartYears: cloneData.governmentRetirementStartYears ?? 0,
        governmentRetirementAdjustment: cloneData.governmentRetirementAdjustment,
        monthlyExpenseRecurring: cloneData.monthlyExpenseRecurring,
        rent: cloneData.rent,
        oneTimeAnnualExpense: cloneData.oneTimeAnnualExpense,
        annualInflation: cloneData.annualInflation,
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

    const baseAge = typeof formData.baseAge === 'string' ? parseInt(formData.baseAge || '0', 10) : formData.baseAge;
    if (isNaN(baseAge) || baseAge < 18 || baseAge > 100) {
      newErrors.baseAge = 'Age must be between 18 and 100';
    }

    if (formData.totalAssets < 0) {
      newErrors.totalAssets = 'Total assets cannot be negative';
    }

    if (formData.monthlySalaryNet < 0) {
      newErrors.monthlySalaryNet = 'Monthly net salary cannot be negative';
    }

    if (formData.governmentRetirementIncome < 0) {
      newErrors.governmentRetirementIncome = 'Government retirement income cannot be negative';
    }

    if (formData.monthlyReturnRate < 0 || formData.monthlyReturnRate > 0.05) {
      newErrors.monthlyReturnRate = 'Monthly return rate must be between 0% and 5%';
    }

    if (formData.fixedAssetsGrowthRate < 0 || formData.fixedAssetsGrowthRate > 0.2) {
      newErrors.fixedAssetsGrowthRate = 'Fixed assets growth rate must be between 0% and 20%';
    }

    if (formData.investmentTaxRate < 0 || formData.investmentTaxRate > 1) {
      newErrors.investmentTaxRate = 'Investment tax rate must be between 0% and 100%';
    }

    if (formData.investmentTaxablePercentage < 0 || formData.investmentTaxablePercentage > 1) {
      newErrors.investmentTaxablePercentage = 'Taxable investments % must be between 0% and 100%';
    }

    const eos = Number(formData.endOfSalaryYears || 0);
    const sor = Number(formData.governmentRetirementStartYears || 0);
    if (isNaN(eos) || eos < 0 || eos > 100) {
      newErrors.endOfSalaryYears = 'End of salary (years) must be between 0 and 100';
    }
    if (isNaN(sor) || sor < 0 || sor > 100) {
      newErrors.governmentRetirementStartYears = 'Government retirement start (years) must be between 0 and 100';
    }

    if (formData.governmentRetirementAdjustment < 0 || formData.governmentRetirementAdjustment > 0.1) {
      newErrors.governmentRetirementAdjustment = 'Government retirement adjustment must be between 0% and 10%';
    }

    if (formData.monthlyExpenseRecurring < 0) {
      newErrors.monthlyExpenseRecurring = 'Monthly expenses cannot be negative';
    }

    if (formData.rent < 0) {
      newErrors.rent = 'Rent cannot be negative';
    }

    if (formData.oneTimeAnnualExpense < 0) {
      newErrors.oneTimeAnnualExpense = 'One-time annual expense cannot be negative';
    }

    if (formData.annualInflation < 0 || formData.annualInflation > 0.2) {
      newErrors.annualInflation = 'Annual inflation must be between 0% and 20%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const processedFormData = { ...formData };

    // Convert date from MM/YYYY to YYYY-MM-01 for backend (first day of month)
    if (processedFormData.startDate) {
      const dateStr = processedFormData.startDate;
      if (/^\d{2}\/\d{4}$/.test(dateStr)) {
        const [month, year] = dateStr.split('/');
        processedFormData.startDate = `${year}-${month}-01`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // If it's neither MM/YYYY nor YYYY-MM, clear it
        processedFormData.startDate = '';
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
        if (name === 'monthlyReturnRate' || name === 'investmentTaxRate' ||
          name === 'governmentRetirementAdjustment' || name === 'annualInflation' || name === 'investmentTaxablePercentage' || name === 'fixedAssetsGrowthRate') {
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
    const oldValue = formData.startDate || '';

    // Get only digits from both values
    const oldDigits = oldValue.replace(/\D/g, '');
    const newDigits = value.replace(/\D/g, '');

    // If digits haven't changed, user just clicked or moved cursor - don't process
    if (oldDigits === newDigits) {
      return;
    }

    const cursorPosition = input.selectionStart || 0;

    // Limit to 6 digits for MM/YYYY
    const limitedDigits = newDigits.slice(0, 6);

    // Format as MM/YYYY
    let formatted = limitedDigits;
    if (limitedDigits.length >= 3) {
      formatted = limitedDigits.slice(0, 2) + '/' + limitedDigits.slice(2);
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

    setFormData(prev => ({ ...prev, startDate: formatted }));
    setHasUnsavedChanges(true);

    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: '' }));
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

    // If already in MM/YYYY format, return as-is
    if (/^\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // If ISO format (YYYY-MM-DD), convert to MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split('-');
      return `${month}/${year}`;
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
    setCurrencyInput(prev => ({ ...prev, [name]: toSet }));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPercentInput(prev => ({ ...prev, [name]: value }));

    const normalized = value.replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    const clamped = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;

    let bounded = clamped;
    if (name === 'monthlyReturnRate') {
      bounded = Math.min(Math.max(bounded, 0), 5);
    } else if (name === 'investmentTaxRate' || name === 'investmentTaxablePercentage') {
      bounded = Math.min(Math.max(bounded, 0), 100);
    } else if (name === 'governmentRetirementAdjustment') {
      bounded = Math.min(Math.max(bounded, 0), 10);
    } else if (name === 'annualInflation' || name === 'fixedAssetsGrowthRate') {
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
    setPercentInput(prev => ({ ...prev, [name]: toSet }));
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
                  <label htmlFor="profileName" className="label-with-icon">
                    Nome do Perfil *
                    <AiInfoButton
                      fieldKey="profile_name"
                      title="Nome do Perfil"
                      staticText="Você poderá ter diversos perfis de aposentadoria, cada um com suas próprias configurações. Esses perfis podem refletir cenários otimistas / pessimistas da economia, ou momentos diferentes da sua vida em que a aposentadoria foi planejada."
                    />
                  </label>
                  <input
                    type="text"
                    id="profileName"
                    name="profileName"
                    value={formData.profileName}
                    onChange={handleChange}
                    className={errors.profileName ? 'error' : ''}
                    required
                    placeholder="Ex: Meu Plano Principal"
                  />
                  {errors.profileName && <span className="error-message">{errors.profileName}</span>}
                </div>

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
                  <label htmlFor="startDate" className="label-with-icon">
                    Data de Início da Aposentadoria
                    <AiInfoButton
                      fieldKey="start_date"
                      title="Data de Início da Aposentadoria"
                      staticText="Em que data você pretende iniciar sua aposentadoria? Esta data será usada como base para diversos cálculos." />
                  </label>
                  <input
                    type="text"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleDateChange}
                    onKeyDown={handleDateKeyDown}
                    placeholder="MM/AAAA"
                    maxLength={7}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="baseAge">Idade Atual *</label>
                  <input
                    type="number"
                    id="baseAge"
                    name="baseAge"
                    value={formData.baseAge}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    min="18"
                    max="100"
                    className={errors.baseAge ? 'error' : ''}
                    required
                  />
                  {errors.baseAge && <span className="error-message">{errors.baseAge}</span>}
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
                  <label htmlFor="totalAssets" className="label-with-icon">
                    Ativos Totais (R$)
                    <AiInfoButton
                      fieldKey="total_assets"
                      title="Ativos Totais"
                      staticText="Todo o dinheiro que você possui atualmente, seja em dinheiro, investimentos, imóveis, etc."
                    />
                  </label>
                  <input
                    type="text"
                    id="totalAssets"
                    name="totalAssets"
                    value={getCurrencyDisplay('totalAssets', formData.totalAssets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'totalAssets')}
                    onBlur={() => handleCurrencyBlur('totalAssets')}
                    placeholder="0,00"
                    className={errors.totalAssets ? 'error' : ''}
                  />
                  {errors.totalAssets && <span className="error-message">{errors.totalAssets}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="fixedAssets">Ativos Fixos (R$)</label>
                  <input
                    type="text"
                    id="fixedAssets"
                    name="fixedAssets"
                    value={getCurrencyDisplay('fixedAssets', formData.fixedAssets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'fixedAssets')}
                    onBlur={() => handleCurrencyBlur('fixedAssets')}
                    placeholder="0,00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fixedAssetsGrowthRate" className="label-with-icon">
                    Taxa de Crescimento de Ativos Fixos (% anual)
                    <AiInfoButton
                      fieldKey="fixed_assets_growth_rate"
                      title="Taxa de Crescimento de Ativos Fixos"
                      prompt={`Me dê, em uma lista muito resumida, a taxa de crescimento de ativos fixos em ${new Date().getFullYear()}. Precisamos de alguma estimativa de mercado (pode ser um intervalo) do quanto ativos fixos (principalmente imóveis) são esperados valorizar por ano. Pode deixar claro na resposta que é uma estimativa macro, e que pode haver, inclusive, desvalorização. Deixe claro também que os ativos fixos são considerados contingência, e não impactam neste cálculo de aposentadoria. Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="fixedAssetsGrowthRate"
                    name="fixedAssetsGrowthRate"
                    value={percentInput['fixedAssetsGrowthRate'] ?? (() => {
                      const v = formData.fixedAssetsGrowthRate * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'fixedAssetsGrowthRate')}
                    onBlur={() => handlePercentageBlur('fixedAssetsGrowthRate')}
                    placeholder="e.g., 4,0 for 4% growth"
                    className={errors.fixedAssetsGrowthRate ? 'error' : ''}
                  />
                  {errors.fixedAssetsGrowthRate && <span className="error-message">{errors.fixedAssetsGrowthRate}</span>}
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
                  <label htmlFor="monthlySalaryNet">Salário Líquido Mensal (R$)</label>
                  <input
                    type="text"
                    id="monthlySalaryNet"
                    name="monthlySalaryNet"
                    value={getCurrencyDisplay('monthlySalaryNet', formData.monthlySalaryNet)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthlySalaryNet')}
                    onBlur={() => handleCurrencyBlur('monthlySalaryNet')}
                    placeholder="0,00"
                    className={errors.monthlySalaryNet ? 'error' : ''}
                  />
                  {errors.monthlySalaryNet && <span className="error-message">{errors.monthlySalaryNet}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="governmentRetirementIncome" className="label-with-icon">
                    Aposentadoria do Governo (R$)
                    <AiInfoButton
                      fieldKey="government_retirement_ceiling"
                      title="Teto da Aposentadoria"
                      prompt={`Me dê, em uma lista muito resumida, o teto para aposentadoria em ${new Date().getFullYear()}, com os principais outros valores. Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="governmentRetirementIncome"
                    name="governmentRetirementIncome"
                    value={getCurrencyDisplay('governmentRetirementIncome', formData.governmentRetirementIncome)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'governmentRetirementIncome')}
                    onBlur={() => handleCurrencyBlur('governmentRetirementIncome')}
                    placeholder="0,00"
                    className={errors.governmentRetirementIncome ? 'error' : ''}
                  />
                  {errors.governmentRetirementIncome && <span className="error-message">{errors.governmentRetirementIncome}</span>}
                </div>
              </div>

              <div className="field-card">
                <h4>Despesas</h4>
                <div className="form-group">
                  <label htmlFor="monthlyExpenseRecurring">Despesas Recorrentes Mensais (R$)</label>
                  <input
                    type="text"
                    id="monthlyExpenseRecurring"
                    name="monthlyExpenseRecurring"
                    value={getCurrencyDisplay('monthlyExpenseRecurring', formData.monthlyExpenseRecurring)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthlyExpenseRecurring')}
                    onBlur={() => handleCurrencyBlur('monthlyExpenseRecurring')}
                    placeholder="0,00"
                    className={errors.monthlyExpenseRecurring ? 'error' : ''}
                  />
                  {errors.monthlyExpenseRecurring && <span className="error-message">{errors.monthlyExpenseRecurring}</span>}
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
                  <label htmlFor="oneTimeAnnualExpense" className="label-with-icon">
                    Despesas Anuais Únicas (R$)
                    <AiInfoButton
                      fieldKey="one_time_annual_expense"
                      title="Despesas Anuais Únicas"
                      staticText="Despesas que você terá que pagar uma vez por ano, como por exemplo, viagens, compras esporádicas, etcs." />
                  </label>
                  <input
                    type="text"
                    id="oneTimeAnnualExpense"
                    name="oneTimeAnnualExpense"
                    value={getCurrencyDisplay('oneTimeAnnualExpense', formData.oneTimeAnnualExpense)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'oneTimeAnnualExpense')}
                    onBlur={() => handleCurrencyBlur('oneTimeAnnualExpense')}
                    placeholder="0,00"
                    className={errors.oneTimeAnnualExpense ? 'error' : ''}
                  />
                  {errors.oneTimeAnnualExpense && <span className="error-message">{errors.oneTimeAnnualExpense}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📊 Investimentos e Estratégia Econômica</h3>
            <div className="form-grid">
              <div className="field-card">
                <h4>Investimentos</h4>
                <div className="form-group">
                  <label htmlFor="monthlyReturnRate" className="label-with-icon">
                    Taxa de Retorno Mensal (%)
                    <AiInfoButton
                      fieldKey="monthly_return_rate"
                      title="Taxa de Retorno Mensal"
                      prompt={`Me dê, em uma lista muito resumida, a taxa de retorno mensal para investimentos em ${new Date().getFullYear()}, com os principais tipos de investimentos (CDI, poupança, CDB, etc.). A ideia é ter balizadores, não preciso de valores exatos. Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="monthlyReturnRate"
                    name="monthlyReturnRate"
                    value={percentInput['monthlyReturnRate'] ?? (() => {
                      const v = formData.monthlyReturnRate * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'monthlyReturnRate')}
                    onBlur={() => handlePercentageBlur('monthlyReturnRate')}
                    placeholder="e.g., 0,5 for 0.5% monthly"
                    className={errors.monthlyReturnRate ? 'error' : ''}
                  />
                  {errors.monthlyReturnRate && <span className="error-message">{errors.monthlyReturnRate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="investmentTaxRate" className="label-with-icon">
                    Imposto sobre Investimento (%)
                    <AiInfoButton
                      fieldKey="investment_tax_rate"
                      title="Imposto sobre Investimentos"
                      prompt={`Me dê, em uma lista muito resumida, a taxa de imposto sobre investimento considerando a lei vigente em ${new Date().getFullYear()} para ganhos de capital. Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="investmentTaxRate"
                    name="investmentTaxRate"
                    value={percentInput['investmentTaxRate'] ?? (() => {
                      const v = formData.investmentTaxRate * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'investmentTaxRate')}
                    onBlur={() => handlePercentageBlur('investmentTaxRate')}
                    placeholder="e.g., 15,0 for 15%"
                    className={errors.investmentTaxRate ? 'error' : ''}
                  />
                  {errors.investmentTaxRate && <span className="error-message">{errors.investmentTaxRate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="investmentTaxablePercentage" className="label-with-icon">
                    Investimentos Tributáveis (%)
                    <AiInfoButton
                      fieldKey="investment_taxable_percentage"
                      title="Percentual de Investimentos Tributáveis"
                      staticText="Nem todos os investimentos são tributáveis. Para um cálculo correto, informe aproximadamente qual o % dos seus investimentos são tributáveis."
                    />
                  </label>
                  <input
                    type="text"
                    id="investmentTaxablePercentage"
                    name="investmentTaxablePercentage"
                    value={percentInput['investmentTaxablePercentage'] ?? (() => {
                      const v = formData.investmentTaxablePercentage * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'investmentTaxablePercentage')}
                    onBlur={() => handlePercentageBlur('investmentTaxablePercentage')}
                    placeholder="e.g., 60,0 for 60% taxable"
                    className={errors.investmentTaxablePercentage ? 'error' : ''}
                  />
                  {errors.investmentTaxablePercentage && <span className="error-message">{errors.investmentTaxablePercentage}</span>}
                </div>


              </div>

              <div className="field-card">
                <h4>Linha do Tempo</h4>
                <div className="form-group">
                  <label htmlFor="governmentRetirementStartYears" className="label-with-icon">
                    Início da Aposentadoria do Governo (anos)
                    <AiInfoButton
                      fieldKey="government_retirement_start_years"
                      title="Início da Aposentadoria do Governo"
                      prompt={`Me explique qu esse valor representa o número de anos a partir da data atual em que a aposentadoria começará a ser recebida. Inclua também o link para o site do governo em que pode ser feita a simulação da aposentadoria, coloque como um texto clicável, faça 1 ou 2 quebras de linha antes do link. Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="number"
                    id="governmentRetirementStartYears"
                    name="governmentRetirementStartYears"
                    value={isNaN(formData.governmentRetirementStartYears ?? NaN) ? '' : formData.governmentRetirementStartYears}
                    onChange={(e) => {
                      const v = e.target.value === '' ? NaN : parseInt(e.target.value, 10);
                      setFormData(prev => ({ ...prev, governmentRetirementStartYears: v }));
                      setHasUnsavedChanges(true);
                      if (errors.governmentRetirementStartYears) setErrors(prev => ({ ...prev, governmentRetirementStartYears: '' }));
                    }}
                    onFocus={handleNumberFocus}
                    min={0}
                    max={100}
                    className={errors.governmentRetirementStartYears ? 'error' : ''}
                  />
                  {errors.governmentRetirementStartYears && <span className="error-message">{errors.governmentRetirementStartYears}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="endOfSalaryYears" className="label-with-icon">
                    Fim do Salário (anos)
                    <AiInfoButton
                      fieldKey="end_of_salary_years"
                      title="Fim do Salário"
                      staticText="Em quantos anos a partir de hoje, você deixará de ter salário?"
                    />
                  </label>
                  <input
                    type="number"
                    id="endOfSalaryYears"
                    name="endOfSalaryYears"
                    value={isNaN(formData.endOfSalaryYears) ? '' : formData.endOfSalaryYears}
                    onChange={(e) => {
                      const v = e.target.value === '' ? NaN : parseInt(e.target.value, 10);
                      setFormData(prev => ({ ...prev, endOfSalaryYears: v }));
                      setHasUnsavedChanges(true);
                      if (errors.endOfSalaryYears) setErrors(prev => ({ ...prev, endOfSalaryYears: '' }));
                    }}
                    onFocus={handleNumberFocus}
                    min={0}
                    max={100}
                    className={errors.endOfSalaryYears ? 'error' : ''}
                  />
                  {errors.endOfSalaryYears && <span className="error-message">{errors.endOfSalaryYears}</span>}
                </div>
              </div>

              <div className="field-card">
                <h4>Premissas Econômicas</h4>
                <div className="form-group">
                  <label htmlFor="governmentRetirementAdjustment" className="label-with-icon">
                    Ajuste da Aposentadoria do Governo (% ao ano)
                    <AiInfoButton
                      fieldKey="government_retirement_adjustment"
                      title="Ajuste da Aposentadoria do Governo"
                      prompt={`Me dê, em uma lista muito resumida, a último informação que temos sobre o % de reajuste da aposentadoria do governo, considerando a lei vigente em ${new Date().getFullYear()}. Fale que "O último valor que temos sobre reajuste de aposentadoria...". Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="governmentRetirementAdjustment"
                    name="governmentRetirementAdjustment"
                    value={percentInput['governmentRetirementAdjustment'] ?? (() => {
                      const v = formData.governmentRetirementAdjustment * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'governmentRetirementAdjustment')}
                    onBlur={() => handlePercentageBlur('governmentRetirementAdjustment')}
                    placeholder="e.g., 4,77 for 4.77%"
                    className={errors.governmentRetirementAdjustment ? 'error' : ''}
                  />
                  {errors.governmentRetirementAdjustment && <span className="error-message">{errors.governmentRetirementAdjustment}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="annualInflation" className="label-with-icon">
                    Taxa de Inflação Anual (%)
                    <AiInfoButton
                      fieldKey="annual_inflation"
                      title="Taxa de Inflação Anual"
                      prompt={`Me dê, em uma lista muito resumida, a previsão de inflação para o ano ${new Date().getFullYear()}. Não precisamos de um número exato, mas de uma estimativa aproximada (pode ser um intervalo, com base em indicadores como IPCA e Selic. Dê a estimativa anual, e deixe claro que é "para o ano". Não ofereça para buscar valores adicionais, e responda somente com a informação, sem conteúdo conversacional (como "Claro!", ou similares).`}
                    />
                  </label>
                  <input
                    type="text"
                    id="annualInflation"
                    name="annualInflation"
                    value={percentInput['annualInflation'] ?? (() => {
                      const v = formData.annualInflation * 100;
                      return isNaN(v) ? '' : v.toFixed(2).replace('.', ',');
                    })()}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentageFocus(e, 'annualInflation')}
                    onBlur={() => handlePercentageBlur('annualInflation')}
                    placeholder="e.g., 3,0 for 3%"
                    className={errors.annualInflation ? 'error' : ''}
                  />
                  {errors.annualInflation && <span className="error-message">{errors.annualInflation}</span>}
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
