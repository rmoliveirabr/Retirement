import React, { useState, useEffect } from 'react';
import { RetirementCalculation, RetirementReadiness, Profile } from '../types';
import { formatBrazilianCurrency } from '../utils/currency';
import ScenarioSimulator from './ScenarioSimulator';
import './RetirementResults.css';

interface RetirementResultsProps {
  calculation?: RetirementCalculation;
  readiness?: RetirementReadiness;
  onClose: () => void;
  profile?: Profile;
  onProfileUpdate?: (profile: Profile) => void;
  onCalculateScenario?: (profile: Profile, scenarioParams: any) => Promise<RetirementCalculation>;
  onSaveProfileAndRecalculate?: (profile: Profile) => void;
}

const RetirementResults: React.FC<RetirementResultsProps> = ({ calculation, readiness, onClose, profile, onProfileUpdate, onCalculateScenario, onSaveProfileAndRecalculate }) => {
  // State to manage current calculation (either original or scenario)
  const [currentCalculation, setCurrentCalculation] = useState(calculation);
  const [isScenario, setIsScenario] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // Reset current calculation when main calculation prop changes
  useEffect(() => {
    setCurrentCalculation(calculation);
    setIsScenario(false);
  }, [calculation]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);
  const formatCurrency = (amount: number) => {
    return formatBrazilianCurrency(amount);
  };

  const formatCurrency0 = (amount: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return formatBrazilianCurrency(Math.round(amount || 0));
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'var(--color-primary)';
    if (score >= 60) return '#f59e0b';
    return '#dc2626';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Ruim';
  };

  // Use currentCalculation or fall back to calculation prop
  const activeCalculation = currentCalculation || calculation;

  // Compute coverage metrics from the timeline
  const timeline: any[] = (activeCalculation?.assumptions.timeline as any[]) || [];
  const depletionIndex = timeline.findIndex((row: any) => row.final_value < 0);
  const lastIndex = timeline.length - 1;
  const yearsCoveredByFunds = depletionIndex >= 0
    ? depletionIndex // number of full years before depletion row
    : (lastIndex >= 0 ? Number(timeline[lastIndex].year) : 0);
  const ageWhenFundsDeplete = depletionIndex >= 0
    ? Number(timeline[depletionIndex].age)
    : (lastIndex >= 0 ? Number(timeline[lastIndex].age) : (profile?.base_age ?? 0));

  // Get Fixed Assets value at retirement from calculation (Issue #4 fix)
  const fixedAssetsAtRetirement = activeCalculation?.assumptions.fixed_assets_at_retirement ?? 0;
  const fixedAssetsGrowthRate = activeCalculation?.assumptions.fixed_assets_growth_rate ?? 0.04;

  // Handler for when scenario is calculated
  const handleScenarioCalculated = (scenarioCalculation: RetirementCalculation) => {
    setCurrentCalculation(scenarioCalculation);
    setIsScenario(true);
  };

  // Handler for scenario calculation
  const handleCalculateScenarioLocal = async (profile: Profile, scenarioParams: any) => {
    if (!onCalculateScenario) return;

    try {
      const calculationResult = await onCalculateScenario(profile, scenarioParams);
      // Update the current calculation state with the scenario result
      setCurrentCalculation(calculationResult);
      setIsScenario(true);
    } catch (error) {
      console.error('Failed to calculate scenario:', error);
    }
  };

  // Handler for when profile is updated from scenario
  const handleProfileUpdate = (updatedProfile: Profile) => {
    setIsScenario(false);
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="retirement-results-overlay" onClick={handleOverlayClick}>
      <div className="retirement-results">
        <div className="results-header">
          <div>
            <h2>Resultados da Análise de Aposentadoria</h2>
            <p className="results-subtitle">Projeções abrangentes de planejamento de aposentadoria para {profile?.email || 'seu perfil'}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="results-content">
          {readiness && (
            <div className="readiness-card">
              <div className="readiness-content">
                <div className="score-circle-wrapper">
                  <svg className="score-svg" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="score-bg"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="score-progress"
                      style={{
                        stroke: getReadinessColor(readiness.readiness_score),
                        strokeDasharray: `${2 * Math.PI * 40}`,
                        strokeDashoffset: `${2 * Math.PI * 40 * (1 - readiness.readiness_score / 100)}`
                      }}
                    />
                  </svg>
                  <div className="score-value">
                    <span className="score-number">{readiness.readiness_score.toFixed(0)}</span>
                  </div>
                </div>
                <div className="score-details">
                  <h3 className="score-label" style={{ color: getReadinessColor(readiness.readiness_score) }}>
                    {getReadinessLabel(readiness.readiness_score)}
                  </h3>
                  <p className="score-description">Baseado no seu perfil financeiro e projeções</p>
                </div>
              </div>
            </div>
          )}

          {profile && calculation && (
            <div className="simulator-section">
              <button 
                className="simulator-toggle-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSimulatorOpen(!simulatorOpen);
                }}
                aria-expanded={simulatorOpen}
                aria-controls="simulator-content"
              >
                <div className="simulator-toggle-content">
                  <h3 className="simulator-title">Simulador de Cenários</h3>
                  <p className="simulator-description">Clique para {simulatorOpen ? 'ocultar' : 'mostrar'} opções de simulação de cenários</p>
                </div>
                <span className="simulator-toggle-icon">
                  {simulatorOpen ? '▲' : '▼'}
                </span>
              </button>
              {simulatorOpen && (
                <div className="simulator-content">
                  <ScenarioSimulator
                    profile={profile}
                    originalCalculation={calculation}
                    onScenarioCalculated={handleScenarioCalculated}
                    onProfileUpdate={handleProfileUpdate}
                    onClose={() => setSimulatorOpen(false)}
                    onUpdateProfile={handleProfileUpdate}
                    onCalculateScenario={handleCalculateScenarioLocal}
                    onSaveProfileAndRecalculate={onSaveProfileAndRecalculate}
                    onCalculate={() => {
                      // Trigger a recalculation when the scenario is calculated
                      if (onProfileUpdate && profile) {
                        onProfileUpdate(profile);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeCalculation && (
            <div className="calculation-section">
              <h3 className="section-title">Projeções de Aposentadoria</h3>
              
              <div className="projection-grid">
                <div className="projection-card">
                  <div className="card-header">
                    <span className="card-icon">📈</span>
                    <h4 className="card-title">Fundo Inicial de Aposentadoria</h4>
                  </div>
                  <div className="card-content">
                    <p className="card-value primary">{formatCurrency0(activeCalculation.total_retirement_fund)}</p>
                    <p className="card-description">Valor projetado na aposentadoria</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-header">
                    <span className="card-icon">🏠</span>
                    <h4 className="card-title">Ativos Fixos Iniciais</h4>
                  </div>
                  <div className="card-content">
                    <p className="card-value">{formatCurrency0(fixedAssetsAtRetirement)}</p>
                    <p className="card-description">Projetado a partir dos seus ativos fixos</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-header">
                    <span className="card-icon">📅</span>
                    <h4 className="card-title">Anos Cobertos pelos Fundos</h4>
                  </div>
                  <div className="card-content">
                    <p className="card-value">{yearsCoveredByFunds}</p>
                    <p className="card-description">Anos completos antes dos fundos se esgotarem</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-header">
                    <span className="card-icon">😊</span>
                    <h4 className="card-title">Idade Quando os Fundos se Esgotam</h4>
                  </div>
                  <div className="card-content">
                    <p className="card-value">{ageWhenFundsDeplete}</p>
                    <p className="card-description">Idade estimada no esgotamento</p>
                  </div>
                </div>
              </div>

              {/* Timeline table */}
              {activeCalculation.assumptions.timeline && activeCalculation.assumptions.timeline.length > 0 && (
                <div className="timeline-section">
                  <div className="timeline-header">
                    <h4 className="timeline-title">Projeções Ano a Ano</h4>
                    <p className="timeline-description">Projeções financeiras detalhadas ao longo do tempo</p>
                  </div>
                  <div className="timeline-table-wrapper">
                    <table className="timeline-table">
                          <thead>
                        <tr>
                          <th>Ano #</th>
                          <th>Idade</th>
                          <th>Período</th>
                          <th>Valor Investido</th>
                          <th>Despesas Totais</th>
                          <th>Renda Total (Salário)</th>
                          <th>Renda Total (Aposentadoria)</th>
                          <th>Total a ser Adicionado</th>
                          <th>Impostos sobre Investimentos</th>
                          <th>Valor Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCalculation.assumptions.timeline.map((row: any, idx: number) => (
                          <tr key={idx} className={row.final_value < 0 ? 'depleted' : ''}>
                            <td>{row.year}</td>
                            <td>{row.age}</td>
                            <td>{row.period}</td>
                            <td>{formatCurrency(row.value_invested)}</td>
                            <td>{formatCurrency(row.total_expenses)}</td>
                            <td>{formatCurrency(row.total_income_salary)}</td>
                            <td>{formatCurrency(row.total_income_retirement)}</td>
                            <td>{formatCurrency(row.total_to_be_added)}</td>
                            <td>{formatCurrency(row.taxes_over_investments ?? 0)}</td>
                            <td>{formatCurrency(row.final_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="results-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetirementResults;
