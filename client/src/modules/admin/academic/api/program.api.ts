// Program API
// API endpoints for program management

import apiClient from '@/api/apiClient';
import type { Program, CreateProgramDto, UpdateProgramDto, ProgramWithAssignments, ProgramWithStats } from '../types/program.types';

export const programApi = {
  // Get programs by school year
  getProgramsBySchoolYear: async (schoolYearId: string, includeAssignments = false): Promise<ProgramWithAssignments[]> => {
    const response = await apiClient.get('/programs', {
      params: {
        schoolYearId,
        includeAssignments
      }
    });
    return response.data.data || response.data;
  },

  // Get program by ID
  getProgramById: async (id: string): Promise<Program> => {
    const response = await apiClient.get(`/programs/${id}`);
    return response.data.data || response.data;
  },

  // Create new program
  createProgram: async (data: CreateProgramDto): Promise<Program> => {
    const response = await apiClient.post('/programs', data);
    return response.data.data || response.data;
  },

  // Update program
  updateProgram: async (id: string, data: UpdateProgramDto): Promise<Program> => {
    const response = await apiClient.patch(`/programs/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete program
  deleteProgram: async (id: string): Promise<void> => {
    await apiClient.delete(`/programs/${id}`);
  },

  // Get programs with stats data
  getProgramsWithStats: async (schoolYearId: string, includeAssignments = false): Promise<ProgramWithStats[]> => {
    const response = await apiClient.get('/programs/with-stats', {
      params: {
        schoolYearId,
        includeAssignments
      }
    });
    return response.data.data || response.data;
  },
};
