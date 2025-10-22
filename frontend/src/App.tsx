import React, { useState, useEffect } from 'react';
import './App.css';
import { Profile, ProfileCreate, ProfileUpdate, RetirementCalculation, RetirementReadiness } from './types';
import { profileApi, retirementApi, healthApi } from './services/api';
import ProfileForm from './components/ProfileForm';
import ProfileList from './components/ProfileList';
import RetirementResults from './components/RetirementResults';

interface ApiResponse {
  message: string;
  version: string;
}

interface HealthResponse {
  status: string;
  message: string;
  environment: string;
}

type ViewMode = 'dashboard' | 'profiles' | 'create-profile' | 'edit-profile' | 'clone-profile' | 'results';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [cloneData, setCloneData] = useState<ProfileCreate | null>(null);
  const [calculation, setCalculation] = useState<RetirementCalculation | null>(null);
  const [readiness, setReadiness] = useState<RetirementReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [targetAge, setTargetAge] = useState<number>(100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [welcomeResponse, healthResponse, profilesResponse] = await Promise.all([
          healthApi.check(),
          healthApi.check(),
          profileApi.getAll().catch(() => []) // Don't fail if profiles can't be loaded
        ]);
        
        setApiData(welcomeResponse);
        setHealthData(healthResponse);
        setProfiles(profilesResponse);
        setError(null);
      } catch (err) {
        setError('Failed to connect to the backend API. Make sure the server is running on port 8000.');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateProfile = async (profileData: ProfileCreate | ProfileUpdate) => {
    // Type guard to ensure we have required fields for creation
    if (!profileData.email) {
      throw new Error('Email is required for profile creation');
    }
    const createData = profileData as ProfileCreate;
    try {
      const newProfile = await profileApi.create(createData);
      setProfiles(prev => [...prev, newProfile]);
      setViewMode('profiles');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async (profileData: ProfileUpdate) => {
    if (!selectedProfile) return;
    
    try {
      const updatedProfile = await profileApi.update(selectedProfile.id, profileData);
      setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? updatedProfile : p));
      setViewMode('profiles');
      setSelectedProfile(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (id: number) => {
    try {
      await profileApi.delete(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  const handleCalculateRetirement = async (profile: Profile) => {
    try {
      setLoading(true);
      const [calculationResult, readinessResult] = await Promise.all([
        retirementApi.calculate({
          profile_id: profile.id,
          expected_return_rate: 0.07,
          retirement_duration_years: 25,
          target_age: targetAge
        }),
        retirementApi.getReadiness(profile.id, 0.07)
      ]);
      
      setCalculation(calculationResult);
      setReadiness(readinessResult);
      setSelectedProfile(profile);
      setViewMode('results');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate retirement projections');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setViewMode('edit-profile');
  };

  const handleCloneProfile = async (profile: Profile) => {
    try {
      setLoading(true);
      const clonedData = await profileApi.clone(profile.id);
      setCloneData(clonedData);
      setViewMode('clone-profile');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clone profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setSelectedProfile(null);
    setCloneData(null);
    setViewMode('profiles');
  };

  const handleCloseResults = () => {
    setCalculation(null);
    setReadiness(null);
    setViewMode('profiles');
  };

  const handleProfileUpdateFromScenario = (updatedProfile: Profile) => {
    // Update profiles list with the updated profile
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setSelectedProfile(updatedProfile);
    setError(null);
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="card">
        <h2>📊 Dashboard Overview</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <h3>Total Profiles</h3>
            <p>{profiles.length}</p>
          </div>
          <div className="stat-item">
            <h3>Active Users</h3>
            <p>{profiles.length}</p>
          </div>
          <div className="stat-item">
            <h3>Calculations Done</h3>
            <p>{profiles.filter(p => p.last_calculation).length}</p>
          </div>
          <div className="stat-item">
            <h3>System Status</h3>
            <p>{healthData?.status === 'healthy' ? '✅ Online' : '❌ Offline'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🚀 Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-btn primary"
            onClick={() => setViewMode('create-profile')}
          >
            <span className="action-icon">➕</span>
            <span>Create New Profile</span>
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setViewMode('profiles')}
          >
            <span className="action-icon">👥</span>
            <span>View All Profiles</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h2>🔧 System Status</h2>
        {loading && <p>Loading system status...</p>}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <p>Please make sure the backend server is running:</p>
            <code>cd backend && pip install -r requirements.txt && python main.py</code>
          </div>
        )}
        {apiData && healthData && (
          <div className="status-info">
            <div className="status-item">
              <span className="status-label">API Status:</span>
              <span className="status-value success">✅ {healthData.status}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Environment:</span>
              <span className="status-value">{healthData.environment}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Version:</span>
              <span className="status-value">{apiData.version}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Message:</span>
              <span className="status-value">{apiData.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="profiles-view">
      <div className="view-header">
        <h2>👥 Retirement Profiles</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setViewMode('create-profile')}
        >
          ➕ Create New Profile
        </button>
      </div>
      <div className="filters" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>🎯 Target Age</span>
          <input
            type="number"
            min={50}
            max={120}
            value={targetAge}
            onChange={(e) => setTargetAge(Math.min(120, Math.max(50, parseInt(e.target.value || '100', 10))))}
            style={{ width: '90px' }}
          />
        </label>
        <small>Used for simulations. Default is 100.</small>
      </div>
      <ProfileList
        profiles={profiles}
        onEdit={handleEditProfile}
        onDelete={handleDeleteProfile}
        onCalculate={handleCalculateRetirement}
        onClone={handleCloneProfile}
        isLoading={loading}
      />
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏦 Retirement Planning App</h1>
        <p>Welcome to your personal retirement planning dashboard</p>
        <nav className="main-nav">
          <button 
            className={`nav-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => setViewMode('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${viewMode === 'profiles' ? 'active' : ''}`}
            onClick={() => setViewMode('profiles')}
          >
            👥 Profiles
          </button>
        </nav>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'profiles' && renderProfiles()}
        {viewMode === 'create-profile' && (
          <ProfileForm
            onSubmit={handleCreateProfile}
            onCancel={handleCloseForm}
            isLoading={loading}
          />
        )}
        {viewMode === 'edit-profile' && selectedProfile && (
          <ProfileForm
            profile={selectedProfile}
            onSubmit={handleUpdateProfile}
            onCancel={handleCloseForm}
            isLoading={loading}
          />
        )}
        {viewMode === 'clone-profile' && cloneData && (
          <ProfileForm
            cloneData={cloneData}
            onSubmit={handleCreateProfile}
            onCancel={handleCloseForm}
            isLoading={loading}
          />
        )}
        {viewMode === 'results' && (calculation || readiness) && (
          <RetirementResults
            calculation={calculation || undefined}
            readiness={readiness || undefined}
            onClose={handleCloseResults}
            profile={selectedProfile || undefined}
            onProfileUpdate={handleProfileUpdateFromScenario}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>© 2025 Retirement Planning App.</p>
      </footer>
    </div>
  );
}

export default App;
