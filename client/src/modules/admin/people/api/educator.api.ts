import { apiClient } from '@/api/apiClient';
import type {
  CreateEducatorDto,
  Educator,
  EducatorQueryParams,
  EducatorWithPassword,
  ResetEducatorPasswordResponse,
  UpdateEducatorDto,
} from '../types/educator.types';

const cleanParams = (params: EducatorQueryParams) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  );
};

export const educatorApi = {
  getAll: async (params: EducatorQueryParams = {}): Promise<Educator[]> => {
    const response = await apiClient.get('/educators', {
      params: cleanParams(params),
    });
    return response.data;
  },

  getById: async (id: string): Promise<Educator> => {
    const response = await apiClient.get(`/educators/${id}`);
    return response.data;
  },

  create: async (data: CreateEducatorDto): Promise<EducatorWithPassword> => {
    const response = await apiClient.post('/educators', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEducatorDto): Promise<Educator> => {
    const response = await apiClient.patch(`/educators/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/educators/${id}`);
  },

  resetPassword: async (id: string): Promise<ResetEducatorPasswordResponse> => {
    const response = await apiClient.post(`/educators/${id}/reset-password`);
    return response.data;
  },
};
