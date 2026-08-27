import { fetchApi } from '../lib/api';
import { ApiResponse, StartupProfile, Challenge, Pilot } from '../types';

export const startupService = {
  async getProfile(): Promise<ApiResponse<StartupProfile>> {
    return fetchApi<ApiResponse<StartupProfile>>('/api/startups/profile');
  },

  async getChallenges(): Promise<ApiResponse<Challenge[]>> {
    return fetchApi<ApiResponse<Challenge[]>>('/api/challenges');
  },

  async getPilots(): Promise<ApiResponse<Pilot[]>> {
    return fetchApi<ApiResponse<Pilot[]>>('/api/pilots');
  },

  async checkHealth(): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>('/api/health');
  },
};
