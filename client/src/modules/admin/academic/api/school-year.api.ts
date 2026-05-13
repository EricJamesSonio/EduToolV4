// School Year API
// API endpoints for school year management

import apiClient from '@/api/apiClient';
import type { SchoolYear } from '../types/school-year.types';

export const schoolYearApi = {
  // Get all school years for the organization
  getAllSchoolYears: async (): Promise<SchoolYear[]> => {
    const response = await apiClient.get('/school-years');
    return response.data.data || response.data;
  },

  // Get the active school year (if exists)
  getActiveSchoolYear: async (): Promise<SchoolYear | null> => {
    try {
      const response = await apiClient.get('/school-years/active');
      return response.data.data || response.data;
    } catch (error) {
      // If no active school year exists, return null
      if ((error as any).response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get school year by ID
  getSchoolYearById: async (id: string): Promise<SchoolYear> => {
    const response = await apiClient.get(`/school-years/${id}`);
    return response.data.data || response.data;
  },

  // Create new school year
  createSchoolYear: async (data: {
    name: string;
    start_date?: string;
    end_date?: string;
    confirm_short_duration?: boolean;
  }): Promise<{ data: SchoolYear; warning?: string }> => {
    const response = await apiClient.post('/school-years', data);
    return response.data.data || response.data;
  },

  // Update school year
  updateSchoolYear: async (
    id: string,
    data: {
      name?: string;
      start_date?: string;
      end_date?: string;
      confirm_short_duration?: boolean;
    }
  ): Promise<SchoolYear> => {
    const response = await apiClient.patch(`/school-years/${id}`, data);
    return response.data.data || response.data;
  },

  // Activate school year
  activateSchoolYear: async (id: string): Promise<SchoolYear> => {
    const response = await apiClient.patch(`/school-years/${id}/activate`);
    return response.data.data || response.data;
  },

  // End school year
  endSchoolYear: async (id: string): Promise<SchoolYear> => {
    const response = await apiClient.patch(`/school-years/${id}/end`);
    return response.data.data || response.data;
  },
};
