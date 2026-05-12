import { apiClient } from './apiClient';
import type { Level, CreateLevelDto, UpdateLevelDto, LevelDefault } from '../types/level.types';

export const levelApi = {
  /**
   * Get all levels for an organization
   */
  getAll: async (params?: { schoolYearId?: string }): Promise<Level[]> => {
    const response = await apiClient.get('/levels', { params });
    return response.data;
  },

  /**
   * Get levels by school year
   */
  getBySchoolYear: async (schoolYearId: string): Promise<Level[]> => {
    const response = await apiClient.get('/levels', {
      params: { schoolYearId }
    });
    return response.data;
  },

  /**
   * Get levels by course and school year
   */
  getByCourse: async (schoolYearId: string, courseId: string): Promise<Level[]> => {
    const response = await apiClient.get('/levels', {
      params: { schoolYearId, courseId }
    });
    return response.data;
  },

  /**
   * Get levels by strand and school year
   */
  getByStrand: async (schoolYearId: string, strandId: string): Promise<Level[]> => {
    const response = await apiClient.get('/levels', {
      params: { schoolYearId, strandId }
    });
    return response.data;
  },

  /**
   * Get default levels (not scoped to school year)
   */
  getDefaults: async (): Promise<LevelDefault[]> => {
    const response = await apiClient.get('/levels/defaults');
    return response.data;
  },

  /**
   * Create a new level
   */
  create: async (data: CreateLevelDto): Promise<Level> => {
    const response = await apiClient.post('/levels', data);
    return response.data;
  },

  /**
   * Update a level
   */
  updateOne: async (id: string, data: UpdateLevelDto): Promise<Level> => {
    const response = await apiClient.patch(`/levels/${id}`, data);
    return response.data;
  },

  /**
   * Delete a level
   */
  deleteOne: async (id: string): Promise<void> => {
    await apiClient.delete(`/levels/${id}`);
  },

  /**
   * Bulk generate levels for a program
   */
  bulkGenerate: async (data: {
    programId: string;
    schoolYearId: string;
    count: number;
  }): Promise<Level[]> => {
    const response = await apiClient.post('/levels/bulk-generate', data);
    return response.data;
  },

  /**
   * Update default level names
   */
  updateDefaults: async (data: {
    levels: Array<{
      id?: string;
      programId: string;
      name: string;
    }>;
  }): Promise<LevelDefault[]> => {
    const response = await apiClient.patch('/levels/defaults', data);
    return response.data;
  },

  /**
   * Add next incremental level for a program
   */
  addNextLevel: async (programId: string, schoolYearId: string): Promise<Level> => {
    const response = await apiClient.post('/levels/add-next', {
      programId,
      schoolYearId,
    });
    return response.data;
  },

  /**
   * Remove a level
   */
  removeLevel: async (levelId: string): Promise<void> => {
    await apiClient.delete(`/levels/${levelId}`);
  },
};
