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
        <div className="loading">Loading profiles...</div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="profile-list">
        <div className="empty-state">
          <h3>No profiles found</h3>
          <p>Create your first retirement profile to get started with planning.</p>
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
                <div className="email-label">Email</div>
                <div className="email-value" title={profile.email}>{profile.email}</div>
              </div>
              <div className="profile-actions">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => onCalculate(profile)}
                  title="Calculate Retirement"
                >
                  📊 Calculate
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => onEdit(profile)}
                  title="Edit Profile"
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => onClone(profile)}
                  title="Clone Profile"
                >
                  📋 Clone
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteClick(profile.id)}
                  title="Delete Profile"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className="profile-content">
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Age:</span>
                  <span className="stat-value">{profile.base_age} years</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Assets:</span>
                  <span className="stat-value">{formatCurrency(profile.total_assets)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Monthly Net Salary:</span>
                  <span className="stat-value">{formatCurrency(profile.monthly_salary_net)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Gov Pension Starts In:</span>
                  <span className="stat-value">{(profile as any).government_retirement_start_years ?? 0} years</span>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Monthly Expenses:</span>
                  <span className="detail-value">{formatCurrency(profile.monthly_expense_recurring + profile.rent)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Monthly Savings:</span>
                  <span className="detail-value">
                    {formatCurrency(profile.monthly_salary_net - (profile.monthly_expense_recurring + profile.rent))}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Monthly Return Rate:</span>
                  <span className="detail-value">
                    {(profile.monthly_return_rate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {profile.last_calculation && (
                <div className="profile-footer">
                  <small>Last calculated: {formatDate(profile.last_calculation)}</small>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this profile? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileList;
