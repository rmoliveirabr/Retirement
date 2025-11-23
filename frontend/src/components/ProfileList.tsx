import React, { useState } from 'react';
import { Profile } from '../types';
import { formatBrazilianCurrency } from '../utils/currency';
import './ProfileList.css';

interface ProfileListProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: number) => void;
  onCalculate: (profile: Profile) => void;
  onClone: (profile: Profile) => void;
  isLoading?: boolean;
}

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  onEdit,
  onDelete,
  onCalculate,
  onClone,
  isLoading = false
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return formatBrazilianCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="profile-list">
        <div className="loading">Carregando perfis...</div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="profile-list">
        <div className="empty-state">
          <h3>Nenhum perfil encontrado</h3>
          <p>Crie seu primeiro perfil de aposentadoria para começar o planejamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-list">
      <div className="profile-grid">
        {profiles.map((profile) => (
          <div key={profile.id} className="profile-card">
            <div className="profile-header">
              <div className="email-block">
                <div className="email-label">Email: {profile.email}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <div className="age-badge">Idade: {profile.baseAge}</div>
                  {profile.lastCalculation && (
                    <span className="last-calc-date">
                      📅 {formatDate(profile.lastCalculation)}
                    </span>
                  )}
                </div>
              </div>
              <div className="profile-menu">
                <button
                  className="menu-button"
                  onClick={() => setOpenMenuId(openMenuId === profile.id ? null : profile.id)}
                  title="Ações"
                >
                  ⋮
                </button>
                {openMenuId === profile.id && (
                  <>
                    <div className="menu-backdrop" onClick={() => setOpenMenuId(null)} />
                    <div className="menu-dropdown">
                      <button onClick={() => { onEdit(profile); setOpenMenuId(null); }}>
                        ✏️ Editar Perfil
                      </button>
                      <button onClick={() => { onClone(profile); setOpenMenuId(null); }}>
                        📋 Clonar Perfil
                      </button>
                      <button className="danger" onClick={() => { handleDeleteClick(profile.id); setOpenMenuId(null); }}>
                        🗑️ Excluir Perfil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="profile-content">
              {/* Key Metrics - 2x2 Grid */}
              <div className="profile-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Ativos Totais</span>
                  <span className="stat-value">{formatCurrency(profile.totalAssets)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Salário Mensal</span>
                  <span className="stat-value">{formatCurrency(profile.monthlySalaryNet)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Despesas Mensais</span>
                  <span className="stat-value">{formatCurrency(profile.monthlyExpenseRecurring + profile.rent)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Poupança Mensal</span>
                  <span className="stat-value savings">{formatCurrency(profile.monthlySalaryNet - (profile.monthlyExpenseRecurring + profile.rent))}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Taxa de Retorno do Investimento</span>
                  <span className="detail-value">{(profile.monthlyReturnRate * 100).toFixed(2)}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Aposentadoria do Governo em</span>
                  <span className="detail-value">{profile.governmentRetirementStartYears ?? 0} anos</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="profile-footer">
                <button
                  className="btn-calculate"
                  onClick={() => onCalculate(profile)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 7H9.01M9 17H9.01M15 7H15.01M15 17H15.01M7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21ZM7 13H17V11H7V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Calcular Aposentadoria
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza de que deseja excluir este perfil? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileList;
