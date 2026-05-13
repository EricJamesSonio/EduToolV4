import { apiClient } from '@/api/apiClient';
import type { CreateStrandDto, Strand, UpdateStrandDto } from '../types/strand.types';

export const strandApi = {
  getAll: async (params: { schoolYearId: string; program_id?: string }): Promise<Strand[]> => {
    const response = await apiClient.get('/strands', { params });
    return response.data;
  },

  getStrandsByProgram: async (schoolYearId: string, programId: string): Promise<Strand[]> => {
    const response = await apiClient.get('/strands', {
      params: { schoolYearId, program_id: programId },
    });
    return response.data;
  },

  createStrand: async (data: CreateStrandDto): Promise<Strand> => {
    const response = await apiClient.post('/strands', data);
    return response.data;
  },

  updateStrand: async (id: string, data: UpdateStrandDto): Promise<Strand> => {
    const response = await apiClient.patch(`/strands/${id}`, data);
    return response.data;
  },

  deleteStrand: async (id: string): Promise<void> => {
    await apiClient.delete(`/strands/${id}`);
  },
};
