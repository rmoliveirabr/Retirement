import React, { useState, useEffect } from 'react';
import { Profile, RetirementCalculation } from '../types';
import { parseBrazilianCurrency, formatBrazilianCurrencyInput } from '../utils/currency';
// formatBrazilianCurrency is not currently used but kept for future reference
import './ScenarioSimulator.css';

interface ScenarioSimulatorProps {
  profile: Profile;
  onClose: () => void;
  onUpdateProfile: (updatedProfile: Profile) => void;
  onCalculate: () => void;
  originalCalculation?: RetirementCalculation;
  onScenarioCalculated?: (calculation: RetirementCalculation) => void;
  onProfileUpdate: (updatedProfile: Profile) => void;
  onCalculateScenario?: (profile: Profile, scenarioParams: any) => void;
  onSaveProfileAndRecalculate?: (profile: Profile) => void;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  profile,
  onClose,
  onUpdateProfile,
  onCalculate,
  originalCalculation,
  onScenarioCalculated,
  onProfileUpdate,
  onCalculateScenario,
  onSaveProfileAndRecalculate,
}) => {
  const [activeTab, setActiveTab] = useState('simulator');
  const [simulationParams, setSimulationParams] = useState({
    totalAssets: profile.total_assets || 0,
    fixedAssets: profile.fixed_assets || 0,
    fixedAssetsGrowthRate: profile.fixed_assets_growth_rate || 0,
    monthlyNetSalary: profile.monthly_salary_net || 0,
    govPension: profile.government_retirement_income || 0,
    yearsUntilSalaryEnds: profile.end_of_salary_years || 0,
    yearsUntilGovRetirement: profile.government_retirement_start_years || 0,
    monthlyExpenses: profile.monthly_expense_recurring || 0,
    monthlyRent: profile.rent || 0,
    oneTimeExpenses: profile.one_time_annual_expense || 0,
    monthlyReturnRate: profile.monthly_return_rate || 0,
    investmentTaxRate: profile.investment_tax_rate || 0,
    annualInflation: profile.annual_inflation || 0,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Currency and percentage input formatting state
  const [currencyInput, setCurrencyInput] = useState<Record<string, string>>({});
  const [percentInput, setPercentInput] = useState<Record<string, string>>({});

  const initialParams = {
    totalAssets: profile.total_assets || 0,
    fixedAssets: profile.fixed_assets || 0,
    fixedAssetsGrowthRate: profile.fixed_assets_growth_rate || 0,
    monthlyNetSalary: profile.monthly_salary_net || 0,
    govPension: profile.government_retirement_income || 0,
    yearsUntilSalaryEnds: profile.end_of_salary_years || 0,
    yearsUntilGovRetirement: profile.government_retirement_start_years || 0,
    monthlyExpenses: profile.monthly_expense_recurring || 0,
    monthlyRent: profile.rent || 0,
    oneTimeExpenses: profile.one_time_annual_expense || 0,
    monthlyReturnRate: profile.monthly_return_rate || 0,
    investmentTaxRate: profile.investment_tax_rate || 0,
    annualInflation: profile.annual_inflation || 0,
  };

  const handleInputChange = (field: string, value: string | number) => {
    setSimulationParams(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatBrazilianCurrencyInput(value);
    const numericValue = parseBrazilianCurrency(formattedValue);
    setCurrencyInput(prev => ({ ...prev, [name]: formattedValue }));
    setSimulationParams(prev => ({ ...prev, [name]: numericValue }));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPercentInput(prev => ({ ...prev, [name]: value }));

    const normalized = value.replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    const numericValue = isNaN(parsed) ? 0 : parsed / 100;

    setSimulationParams(prev => ({ ...prev, [name]: numericValue }));
  };

  const formatNumberForInput = (amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    const hasDecimals = Math.abs(amount % 1) > 0;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencyDisplay = (name: string, numericValue: number) => {
    return currencyInput[name] ?? formatNumberForInput(numericValue ?? 0);
  };

  const getPercentDisplay = (name: string, numericValue: number) => {
    return percentInput[name] ?? (isNaN(numericValue) ? '' : ((numericValue * 100).toFixed(2)).replace('.', ','));
  };

  const handleCurrencyFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    const current = currencyInput[name] ?? formatNumberForInput(simulationParams[name as keyof typeof simulationParams] as number);
    if (current === '0' || current === '0,00' || current === '') {
      e.target.select();
    }
    const toSet = (current === '0' || current === '0,00') ? '' : current;
    setCurrencyInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handleCurrencyBlur = (name: string) => {
    const numericValue = simulationParams[name as keyof typeof simulationParams] as number ?? 0;
    setCurrencyInput(prev => ({ ...prev, [name]: formatNumberForInput(numericValue) }));
  };

  const handlePercentFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    const defaultVal = ('' + ((simulationParams[name as keyof typeof simulationParams] as number ?? 0) * 100));
    const formattedDefault = isNaN(parseFloat(defaultVal)) ? '' : (parseFloat(defaultVal).toFixed(2).replace('.', ','));
    if (formattedDefault === '0,00' || formattedDefault === '0' || formattedDefault === '') {
      e.target.select();
    }
    const toSet = (formattedDefault === '0,00' || formattedDefault === '0') ? '' : formattedDefault;
    setPercentInput(prev => ({ ...prev, [name]: prev[name] ?? toSet }));
  };

  const handlePercentBlur = (name: string) => {
    const numericValue = simulationParams[name as keyof typeof simulationParams] as number ?? 0;
    const display = isNaN(numericValue) ? '' : ((numericValue * 100).toFixed(2)).replace('.', ',');
    setPercentInput(prev => ({ ...prev, [name]: display }));
  };

  const handleReset = () => {
    setSimulationParams({ ...initialParams });
  };

  const handleRecalculate = () => {
    // Only trigger calculation without saving to profile
    if (onCalculateScenario) {
      onCalculateScenario(profile, simulationParams);
    }
    setSuccessMessage('Cálculo atualizado com sucesso.');
    setShowSuccessModal(true);
  };

  const handleSaveToProfile = async () => {
    const updatedProfile = {
      ...profile,
      total_assets: simulationParams.totalAssets,
      fixed_assets: simulationParams.fixedAssets,
      fixed_assets_growth_rate: simulationParams.fixedAssetsGrowthRate,
      monthly_salary_net: simulationParams.monthlyNetSalary,
      government_retirement_income: simulationParams.govPension,
      end_of_salary_years: simulationParams.yearsUntilSalaryEnds,
      government_retirement_start_years: simulationParams.yearsUntilGovRetirement,
      monthly_expense_recurring: simulationParams.monthlyExpenses,
      rent: simulationParams.monthlyRent,
      one_time_annual_expense: simulationParams.oneTimeExpenses,
      monthly_return_rate: simulationParams.monthlyReturnRate,
      investment_tax_rate: simulationParams.investmentTaxRate,
      annual_inflation: simulationParams.annualInflation,
    };

    if (onSaveProfileAndRecalculate) {
      await onSaveProfileAndRecalculate(updatedProfile);
      setSuccessMessage('Perfil atualizado com sucesso.');
      setShowSuccessModal(true);
    }
  };

  useEffect(() => {
    setSimulationParams({
      totalAssets: profile.total_assets || 0,
      fixedAssets: profile.fixed_assets || 0,
      fixedAssetsGrowthRate: profile.fixed_assets_growth_rate || 0,
      monthlyNetSalary: profile.monthly_salary_net || 0,
      govPension: profile.government_retirement_income || 0,
      yearsUntilSalaryEnds: profile.end_of_salary_years || 0,
      yearsUntilGovRetirement: profile.government_retirement_start_years || 0,
      monthlyExpenses: profile.monthly_expense_recurring || 0,
      monthlyRent: profile.rent || 0,
      oneTimeExpenses: profile.one_time_annual_expense || 0,
      monthlyReturnRate: profile.monthly_return_rate || 0,
      investmentTaxRate: profile.investment_tax_rate || 0,
      annualInflation: profile.annual_inflation || 0,
    });
  }, [profile]);

  return (
    <div className="simulator-container">
      <div className="simulator-header">
        <h2>Simulador de Cenários</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="simulator-tabs">
        <button
          className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          Simulador
        </button>
        <button
          className={`tab-btn ${activeTab === 'projection' ? 'active' : ''}`}
          onClick={() => setActiveTab('projection')}
        >
          Projeção
        </button>
      </div>

      {activeTab === 'simulator' && (
        <div className="simulator-form">
          <div className="form-description">
            <p>Ajuste os parâmetros abaixo para explorar diferentes cenários. As mudanças não afetarão seu perfil até que você salve.</p>
          </div>

          <div className="form-grid">
            {/* Assets Column */}
            <div className="form-column">
              <h4 className="column-header">
                <span className="column-icon">📈</span>
                Ativos
              </h4>
              <div className="column-fields">
                <div className="form-group">
                  <label htmlFor="totalAssets">Total de Ativos (R$)</label>
                  <input
                    id="totalAssets"
                    type="text"
                    value={getCurrencyDisplay('totalAssets', simulationParams.totalAssets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'totalAssets')}
                    onBlur={() => handleCurrencyBlur('totalAssets')}
                    name="totalAssets"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fixedAssets">Ativos Fixos (R$)</label>
                  <input
                    id="fixedAssets"
                    type="text"
                    value={getCurrencyDisplay('fixedAssets', simulationParams.fixedAssets)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'fixedAssets')}
                    onBlur={() => handleCurrencyBlur('fixedAssets')}
                    name="fixedAssets"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fixedGrowth">Crescimento de Ativos Fixos (%/ano)</label>
                  <input
                    id="fixedGrowth"
                    type="text"
                    value={getPercentDisplay('fixedAssetsGrowthRate', simulationParams.fixedAssetsGrowthRate)}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentFocus(e, 'fixedAssetsGrowthRate')}
                    onBlur={() => handlePercentBlur('fixedAssetsGrowthRate')}
                    name="fixedAssetsGrowthRate"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Income Column */}
            <div className="form-column">
              <h4 className="column-header">
                <span className="column-icon">💰</span>
                Renda
              </h4>
              <div className="column-fields">
                <div className="form-group">
                  <label htmlFor="salary">Salário Mensal Líquido (R$)</label>
                  <input
                    id="salary"
                    type="text"
                    value={getCurrencyDisplay('monthlyNetSalary', simulationParams.monthlyNetSalary)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthlyNetSalary')}
                    onBlur={() => handleCurrencyBlur('monthlyNetSalary')}
                    name="monthlyNetSalary"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="govPension">Renda da Previdência (R$)</label>
                  <input
                    id="govPension"
                    type="text"
                    value={getCurrencyDisplay('govPension', simulationParams.govPension)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'govPension')}
                    onBlur={() => handleCurrencyBlur('govPension')}
                    name="govPension"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salaryYears">Anos até fim do salário</label>
                  <input
                    id="salaryYears"
                    type="number"
                    value={simulationParams.yearsUntilSalaryEnds}
                    onChange={(e) => handleInputChange('yearsUntilSalaryEnds', e.target.value)}
                    name="yearsUntilSalaryEnds"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="govYears">Anos até aposentadoria gov.</label>
                  <input
                    id="govYears"
                    type="number"
                    value={simulationParams.yearsUntilGovRetirement}
                    onChange={(e) => handleInputChange('yearsUntilGovRetirement', e.target.value)}
                    name="yearsUntilGovRetirement"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Expenses Column */}
            <div className="form-column">
              <h4 className="column-header">
                <span className="column-icon">🏠</span>
                Despesas
              </h4>
              <div className="column-fields">
                <div className="form-group">
                  <label htmlFor="expenses">Mensais Recorrentes (R$)</label>
                  <input
                    id="expenses"
                    type="text"
                    value={getCurrencyDisplay('monthlyExpenses', simulationParams.monthlyExpenses)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthlyExpenses')}
                    onBlur={() => handleCurrencyBlur('monthlyExpenses')}
                    name="monthlyExpenses"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rent">Aluguel Mensal (R$)</label>
                  <input
                    id="rent"
                    type="text"
                    value={getCurrencyDisplay('monthlyRent', simulationParams.monthlyRent)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'monthlyRent')}
                    onBlur={() => handleCurrencyBlur('monthlyRent')}
                    name="monthlyRent"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="oneTime">Anuais Únicos (R$)</label>
                  <input
                    id="oneTime"
                    type="text"
                    value={getCurrencyDisplay('oneTimeExpenses', simulationParams.oneTimeExpenses)}
                    onChange={handleCurrencyChange}
                    onFocus={(e) => handleCurrencyFocus(e, 'oneTimeExpenses')}
                    onBlur={() => handleCurrencyBlur('oneTimeExpenses')}
                    name="oneTimeExpenses"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Rates Column */}
            <div className="form-column">
              <h4 className="column-header">
                <span className="column-icon">📈</span>
                Taxas
              </h4>
              <div className="column-fields">
                <div className="form-group">
                  <label htmlFor="return">Taxa de Retorno Mensal (%)</label>
                  <input
                    id="return"
                    type="text"
                    value={getPercentDisplay('monthlyReturnRate', simulationParams.monthlyReturnRate)}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentFocus(e, 'monthlyReturnRate')}
                    onBlur={() => handlePercentBlur('monthlyReturnRate')}
                    name="monthlyReturnRate"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tax">Taxa de Imposto s/ Invest. (%)</label>
                  <input
                    id="tax"
                    type="text"
                    value={getPercentDisplay('investmentTaxRate', simulationParams.investmentTaxRate)}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentFocus(e, 'investmentTaxRate')}
                    onBlur={() => handlePercentBlur('investmentTaxRate')}
                    name="investmentTaxRate"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="inflation">Inflação Anual (%)</label>
                  <input
                    id="inflation"
                    type="text"
                    value={getPercentDisplay('annualInflation', simulationParams.annualInflation)}
                    onChange={handlePercentageChange}
                    onFocus={(e) => handlePercentFocus(e, 'annualInflation')}
                    onBlur={() => handlePercentBlur('annualInflation')}
                    name="annualInflation"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleRecalculate}>
              Recalcular
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveToProfile}>
              Salvar no Perfil
            </button>
          </div>
        </div>
      )}

      {activeTab === 'projection' && (
        <div className="projection-view">
          <div className="projection-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab('simulator')}
            >
              Voltar ao Simulador
            </button>
            <button className="btn btn-primary">
              Exportar Projeção
            </button>
          </div>
          <div className="projection-content">
            <p>Gráfico de projeção será exibido aqui.</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon success">✓</div>
            <h3>Sucesso!</h3>
            <p>{successMessage}</p>
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
            <h3>Erro</h3>
            <p>Ocorreu um erro ao processar sua solicitação.</p>
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
