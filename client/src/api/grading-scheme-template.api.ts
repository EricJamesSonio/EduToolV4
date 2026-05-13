// Grading Scheme Template API
// API client for grading scheme template operations

import { apiClient } from './apiClient';
import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
  UpdateGradingSchemeTemplateDto,
} from '../types/grading-scheme.types';

export const gradingSchemeTemplateApi = {
  getAll: async (programType?: string): Promise<GradingSchemeTemplate[]> => {
    const params = programType ? { programType } : undefined;
    const response = await apiClient.get('/grading-scheme-templates', { params });
    return response.data;
  },

  getById: async (id: string): Promise<GradingSchemeTemplate> => {
    const response = await apiClient.get(`/grading-scheme-templates/${id}`);
    return response.data;
  },

  create: async (data: CreateGradingSchemeTemplateDto): Promise<GradingSchemeTemplate> => {
    const response = await apiClient.post('/grading-scheme-templates', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGradingSchemeTemplateDto): Promise<GradingSchemeTemplate> => {
    const response = await apiClient.patch(`/grading-scheme-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/grading-scheme-templates/${id}`);
  },
};