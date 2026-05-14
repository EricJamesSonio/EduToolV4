import { apiClient } from '@/api/apiClient';
import type { Subject, QuerySubjectParams } from '../types/subject.types';

const cleanParams = (params: QuerySubjectParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

export const subjectApi = {
  getAll: async (params: QuerySubjectParams = {}): Promise<Subject[]> => {
    const response = await apiClient.get('/subjects', {
      params: cleanParams(params),
    });
    return response.data;
  },

  getById: async (id: string): Promise<Subject> => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data;
  },
};