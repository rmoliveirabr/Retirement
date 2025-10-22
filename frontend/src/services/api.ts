import axios from 'axios';
import { Profile, ProfileCreate, ProfileUpdate, RetirementCalculation, CalculationRequest, RetirementReadiness, ScenarioRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Profile API
export const profileApi = {
  // Get all profiles
  getAll: async (): Promise<Profile[]> => {
    const response = await api.get('/api/profiles');
    return response.data;
  },

  // Get profile by ID
  getById: async (id: number): Promise<Profile> => {
    const response = await api.get(`/api/profiles/${id}`);
    return response.data;
  },

  // Get profile by email
  getByEmail: async (email: string): Promise<Profile> => {
    const response = await api.get(`/api/profiles/email/${email}`);
    return response.data;
  },

  // Create new profile
  create: async (profile: ProfileCreate): Promise<Profile> => {
    const response = await api.post('/api/profiles', profile);
    return response.data;
  },

  // Update profile
  update: async (id: number, profile: ProfileUpdate): Promise<Profile> => {
    const response = await api.put(`/api/profiles/${id}`, profile);
    return response.data;
  },

  // Delete profile
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/profiles/${id}`);
  },

  // Clone profile (returns ProfileCreate data with empty email)
  clone: async (id: number): Promise<ProfileCreate> => {
    const response = await api.post(`/api/profiles/${id}/clone`);
    return response.data;
  },
};

// Retirement calculation API
export const retirementApi = {
  // Calculate retirement projections
  calculate: async (request: CalculationRequest): Promise<RetirementCalculation> => {
    const response = await api.post('/api/retirement/calculate', request);
    return response.data;
  },

  // Get retirement readiness
  getReadiness: async (profileId: number, expectedReturnRate: number = 0.07): Promise<RetirementReadiness> => {
    const response = await api.get(`/api/retirement/readiness/${profileId}?expected_return_rate=${expectedReturnRate}`);
    return response.data;
  },

  // Calculate scenario with profile overrides (doesn't modify profile)
  calculateScenario: async (request: ScenarioRequest): Promise<RetirementCalculation> => {
    const response = await api.post('/api/retirement/scenario', request);
    return response.data;
  },
};

// Health check API
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;

