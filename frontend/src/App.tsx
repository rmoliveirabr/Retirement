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

type ViewMode = 'list' | 'create-profile' | 'edit-profile' | 'clone-profile' | 'results';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [cloneData, setCloneData] = useState<ProfileCreate | null>(null);
  const [calculation, setCalculation] = useState<RetirementCalculation | null>(null);
  const [readiness, setReadiness] = useState<RetirementReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [apiData, setApiData] = useState<ApiResponse | null>(null);
  // const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [targetAge, setTargetAge] = useState<number>(100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [, , profilesResponse] = await Promise.all([
          healthApi.check(),
          healthApi.check(),
          profileApi.getAll().catch(() => []) // Don't fail if profiles can't be loaded
        ]);

        // setApiData(welcomeResponse);
        // setHealthData(healthResponse);
        setProfiles(profilesResponse);
        setError(null);
      } catch (err) {
        setError('Failed to connect to the backend API. Please try again later.');
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
      setViewMode('list');
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
      setViewMode('list');
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
          profileId: profile.id,
          expectedReturnRate: 0.07,
          retirementDurationYears: 25,
          targetAge: targetAge
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
    setViewMode('list');
    setSelectedProfile(null);
    setCloneData(null);
  };

  const handleCloseResults = () => {
    setViewMode('list');
    setCalculation(null);
    setReadiness(null);
  };

  const handleCalculateScenario = async (profile: Profile, scenarioParams: any): Promise<RetirementCalculation> => {
    const calculationResult = await retirementApi.calculateScenario({
      profileId: profile.id,
      expectedReturnRate: 0.07,
      retirementDurationYears: 25,
      targetAge: targetAge,
      // Override with scenario parameters
      totalAssets: scenarioParams.totalAssets,
      fixedAssets: scenarioParams.fixedAssets,
      monthlySalaryNet: scenarioParams.monthlyNetSalary,
      governmentRetirementIncome: scenarioParams.govPension,
      monthlyReturnRate: scenarioParams.monthlyReturnRate,
      fixedAssetsGrowthRate: scenarioParams.fixedAssetsGrowthRate,
      investmentTaxRate: scenarioParams.investmentTaxRate,
      endOfSalaryYears: scenarioParams.yearsUntilSalaryEnds,
      governmentRetirementStartYears: scenarioParams.yearsUntilGovRetirement,
      monthlyExpenseRecurring: scenarioParams.monthlyExpenses,
      rent: scenarioParams.monthlyRent,
      oneTimeAnnualExpense: scenarioParams.oneTimeExpenses,
      annualInflation: scenarioParams.annualInflation,
    });

    return calculationResult;
  };

  const handleProfileUpdateFromScenario = (updatedProfile: Profile) => {
    // Update profiles list with the updated profile
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setSelectedProfile(updatedProfile);
    setError(null);
  };

  const handleSaveProfileAndRecalculate = async (updatedProfile: Profile) => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      // Save the profile to backend
      const savedProfile = await profileApi.update(selectedProfile.id, {
        email: updatedProfile.email,
        baseAge: updatedProfile.baseAge,
        totalAssets: updatedProfile.totalAssets,
        fixedAssets: updatedProfile.fixedAssets,
        monthlySalaryNet: updatedProfile.monthlySalaryNet,
        governmentRetirementIncome: updatedProfile.governmentRetirementIncome,
        governmentRetirementStartYears: updatedProfile.governmentRetirementStartYears,
        governmentRetirementAdjustment: updatedProfile.governmentRetirementAdjustment,
        monthlyReturnRate: updatedProfile.monthlyReturnRate,
        fixedAssetsGrowthRate: updatedProfile.fixedAssetsGrowthRate,
        investmentTaxRate: updatedProfile.investmentTaxRate,
        investmentTaxablePercentage: updatedProfile.investmentTaxablePercentage,
        endOfSalaryYears: updatedProfile.endOfSalaryYears,
        monthlyExpenseRecurring: updatedProfile.monthlyExpenseRecurring,
        rent: updatedProfile.rent,
        oneTimeAnnualExpense: updatedProfile.oneTimeAnnualExpense,
        annualInflation: updatedProfile.annualInflation,
      });

      // Update local state
      setProfiles(prev => prev.map(p => p.id === savedProfile.id ? savedProfile : p));
      setSelectedProfile(savedProfile);

      // Recalculate with the updated profile
      const [calculationResult, readinessResult] = await Promise.all([
        retirementApi.calculate({
          profileId: savedProfile.id,
          expectedReturnRate: 0.07,
          retirementDurationYears: 25,
          targetAge: targetAge
        }),
        retirementApi.getReadiness(savedProfile.id, 0.07)
      ]);

      setCalculation(calculationResult);
      setReadiness(readinessResult);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile and recalculate');
    } finally {
      setLoading(false);
    }
  };

  const renderProfiles = () => (
    <ProfileList
      profiles={profiles}
      onEdit={handleEditProfile}
      onDelete={handleDeleteProfile}
      onCalculate={handleCalculateRetirement}
      onClone={handleCloneProfile}
      isLoading={loading}
    />
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content-wrapper">
          <div>
            <h1>Planejamento de Aposentadoria</h1>
            <p>Planeje seu futuro financeiro com confiança</p>
          </div>
          <div className="target-age-badge">
            <label htmlFor="target-age-input" className="badge-label">Idade Alvo:</label>
            <input
              id="target-age-input"
              type="number"
              className="badge-input"
              value={targetAge}
              onChange={(e) => setTargetAge(Number(e.target.value))}
              min="50"
              max="120"
            />
          </div>
        </div>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="profiles-header">
          <div>
            <h2>Seus Perfis</h2>
            <p>Gerencie e calcule cenários de aposentadoria</p>
          </div>
          <button className="btn-create" onClick={() => setViewMode('create-profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Criar Perfil
          </button>
        </div>

        {renderProfiles()}
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
            onCalculateScenario={handleCalculateScenario}
            onSaveProfileAndRecalculate={handleSaveProfileAndRecalculate}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>© 2025 Planejamento de Aposentadoria.</p>
      </footer>
    </div>
  );
}

export default App;
