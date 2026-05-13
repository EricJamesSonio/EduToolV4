// ===== client/src/api/grading-scale.api.ts =====

import { apiClient } from '@/api/apiClient';
import type {
  GradingScale,
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
} from '../../system/types/grading-scale.types';

export const gradingScaleApi = {
  getAll: async (params?: QueryGradingScaleDto): Promise<GradingScale[]> => {
    const response = await apiClient.get('/grading-scales', { params });
    return response.data;
  },

  create: async (data: CreateGradingScaleDto): Promise<GradingScale> => {
    const response = await apiClient.post('/grading-scales', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGradingScaleDto): Promise<GradingScale> => {
    const response = await apiClient.patch(`/grading-scales/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/grading-scales/${id}`);
  },
};