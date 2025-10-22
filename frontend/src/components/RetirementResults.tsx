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
}

const RetirementResults: React.FC<RetirementResultsProps> = ({ calculation, readiness, onClose, profile, onProfileUpdate }) => {
  // State to manage current calculation (either original or scenario)
  const [currentCalculation, setCurrentCalculation] = useState(calculation);
  const [isScenario, setIsScenario] = useState(false);

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
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
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
          <h2>Retirement Analysis Results {isScenario && <span className="scenario-badge">Scenario</span>}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="results-content">
          {readiness && (
            <div className="readiness-section">
              <h3>📊 Retirement Readiness</h3>
              <div className="readiness-score">
                <div 
                  className="score-circle"
                  style={{ borderColor: getReadinessColor(readiness.readiness_score) }}
                >
                  <span className="score-number">{readiness.readiness_score.toFixed(0)}</span>
                  <span className="score-label">Score</span>
                </div>
                <div className="score-details">
                  <h4 style={{ color: getReadinessColor(readiness.readiness_score) }}>
                    {getReadinessLabel(readiness.readiness_score)}
                  </h4>
                  <p>Based on your financial profile and projections</p>
                </div>
              </div>
            </div>
          )}

          {profile && calculation && (
            <ScenarioSimulator
              profile={profile}
              originalCalculation={calculation}
              onScenarioCalculated={handleScenarioCalculated}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {activeCalculation && (
            <div className="calculation-section">
              <h3>💰 Retirement Projections</h3>
              
              <div className="projection-grid">
                <div className="projection-card primary">
                  <div className="card-icon">🎯</div>
                  <div className="card-content">
                    <h4>Initial Retirement Fund</h4>
                    <p className="card-value">{formatCurrency0(activeCalculation.total_retirement_fund)}</p>
                    <p className="card-description">Projected value at retirement</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-icon">🏠</div>
                  <div className="card-content">
                    <h4>Initial Fixed Assets ({(fixedAssetsGrowthRate * 100).toFixed(1)}%/yr)</h4>
                    <p className="card-value">{formatCurrency0(fixedAssetsAtRetirement)}</p>
                    <p className="card-description">Projected from your fixed assets</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-icon">📅</div>
                  <div className="card-content">
                    <h4>Years Covered by Funds</h4>
                    <p className="card-value">{yearsCoveredByFunds}</p>
                    <p className="card-description">Full years before funds deplete</p>
                  </div>
                </div>

                <div className="projection-card">
                  <div className="card-icon">🧓</div>
                  <div className="card-content">
                    <h4>Age When Funds Deplete</h4>
                    <p className="card-value">{ageWhenFundsDeplete}</p>
                    <p className="card-description">Estimated age at depletion</p>
                  </div>
                </div>
              </div>

              {/* Timeline table */}
              {activeCalculation.assumptions.timeline && activeCalculation.assumptions.timeline.length > 0 && (
                <div className="timeline-section">
                  <h4>📈 Year-by-year Projections</h4>
                  <div className="timeline-table-wrapper">
                    <table className="timeline-table">
                          <thead>
                        <tr>
                          <th>Year #</th>
                          <th>Age</th>
                          <th>Period</th>
                          <th>Value Invested</th>
                          <th>Total Expenses</th>
                          <th>Total Income (Salary)</th>
                          <th>Total Income (Retirement)</th>
                          <th>Total to be Added</th>
                          <th>Taxes over Investments</th>
                          <th>Final Value</th>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetirementResults;
