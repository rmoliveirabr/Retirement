import React, { useState, useEffect } from 'react';
import { RetirementCalculation, RetirementReadiness, Profile } from '../types';
import { formatBrazilianCurrency } from '../utils/currency';
import ScenarioSimulator from './ScenarioSimulator';
import { askAI } from "../services/api";
import './RetirementResults.css';

import ReactMarkdown from "react-markdown";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // handle ask to AI
  const handleAskAI = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion(""); // Clear input immediately

    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user' as const, content: userQuestion }];
    setChatHistory(newHistory);

    try {
      setLoading(true);
      setError("");

      // Calculation should contain the rows you display
      const results = activeCalculation?.assumptions?.timeline || [];

      // Use the active calculation's assumptions if available, as they might contain scenario overrides
      // Merge them with the base profile to ensure we have all fields
      const contextProfile = {
        ...profile,
        ...activeCalculation?.assumptions
      };

      // Pass the *previous* history (excluding the current question) to the API
      const response = await askAI(userQuestion, contextProfile, results, chatHistory);

      setChatHistory([...newHistory, { role: 'assistant', content: response.answer }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      // Optionally remove the user question if it failed, or show error in chat
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setQuestion("");
    setError("");
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
    : (lastIndex >= 0 ? Number(timeline[lastIndex].age) : (profile?.baseAge ?? 0));

  // Get Fixed Assets value at retirement from calculation (Issue #4 fix)
  const fixedAssetsAtRetirement = activeCalculation?.assumptions.fixedAssetsAtRetirement ?? 0;
  const fixedAssetsGrowthRate = activeCalculation?.assumptions.fixedAssetsGrowthRate ?? 0.04;

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
                        stroke: getReadinessColor(readiness.readinessScore),
                        strokeDasharray: `${2 * Math.PI * 40}`,
                        strokeDashoffset: `${2 * Math.PI * 40 * (1 - readiness.readinessScore / 100)}`
                      }}
                    />
                  </svg>
                  <div className="score-value">
                    <span className="score-number">{readiness.readinessScore.toFixed(0)}</span>
                  </div>
                </div>
                <div className="score-details">
                  <h3 className="score-label" style={{ color: getReadinessColor(readiness.readinessScore) }}>
                    {getReadinessLabel(readiness.readinessScore)}
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
                    <p className="card-value primary">{formatCurrency0(activeCalculation.totalRetirementFund)}</p>
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
          {/* 💬 Ask AI icon */}
          <button
            onClick={() => setIsModalOpen(true)}
            title="Pergunta para a IA sobre seu plano de aposentadoria"
            className="btn btn-ai-trigger"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ai-icon">
              <path d="M12 4L14.4 9.6L20 12L14.4 14.4L12 20L9.6 14.4L4 12L9.6 9.6L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 4L19.2 6.8L22 8L19.2 9.2L18 12L16.8 9.2L14 8L16.8 6.8L18 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Pergunte para a IA
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="ai-question-modal">
            <div className="ai-question-modal-content">
              <div className="ai-modal-header">
                <h3 className="ai-modal-title">Assistente de Aposentadoria</h3>
                {chatHistory.length > 0 && (
                  <button className="btn-clear" onClick={handleClearChat}>
                    Limpar Conversa
                  </button>
                )}
              </div>

              <div className="ai-chat-container">
                {chatHistory.length === 0 ? (
                  <div className="ai-empty-state">
                    <p>Olá! Eu analisei seu perfil e projeções.</p>
                    <p>Pergunte-me sobre seus investimentos, idade de aposentadoria ou como melhorar seus resultados.</p>
                  </div>
                ) : (
                  <div className="ai-chat-history">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`ai-message ${msg.role}`}>
                        <div className="ai-message-bubble">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="ai-message assistant">
                        <div className="ai-message-bubble loading">
                          Pensando...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ai-input-area">
                <textarea
                  className="ai-modal-textarea"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Digite sua pergunta aqui..."
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                />
                <div className="ai-modal-actions">
                  <button className="btn btn-primary" onClick={handleAskAI} disabled={loading || !question.trim()}>
                    Enviar
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Fechar</button>
                </div>
              </div>

              {error && <p className="ai-error">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetirementResults;
