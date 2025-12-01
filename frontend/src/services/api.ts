import axios from 'axios';
import { Profile, ProfileCreate, ProfileUpdate, RetirementCalculation, CalculationRequest, RetirementReadiness, ScenarioRequest } from '../types';

// In production, we FORCE relative paths to use Vercel Rewrites and bypass CORS/Auth issues
// In development, we default to localhost
const isDevelopment = process.env.NODE_ENV === 'development';
// FORCE relative path in production even if env var is set (to override Vercel Dashboard settings)
const API_BASE_URL = isDevelopment ? (process.env.REACT_APP_API_URL || 'http://localhost:8000') : '';
console.log('🔌 API Base URL:', API_BASE_URL || '(Relative Path - Proxy Active)');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    const response = await api.get(`/api/profiles/${id}/clone`);
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

// AI API
export const askAI = async (question: string, profile: any, results: any[], history: any[] = []) => {
  const payload = { question, profile, results, history };
  const response = await api.post(`/api/ai/ask`, payload);
  return response.data; // { answer: "..." } 
};

// Health check API
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
