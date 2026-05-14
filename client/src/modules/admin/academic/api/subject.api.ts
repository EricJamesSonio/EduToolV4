import { apiClient } from '@/api/apiClient';
import type { Subject, QuerySubjectParams } from '../types/subject.types';

export interface CreateSubjectDto {
  name: string;
  subjectType?: 'major' | 'minor';
  programId: string;
  levelId?: string;
  courseId?: string;
  strandId?: string;
  yearLevel?: string;
  termLabel?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  levelId?: string;
  courseId?: string;
  strandId?: string;
  yearLevel?: string;
  termLabel?: string;
}

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

  create: async (dto: CreateSubjectDto): Promise<Subject> => {
    const response = await apiClient.post('/subjects', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateSubjectDto): Promise<Subject> => {
    const response = await apiClient.patch(`/subjects/${id}`, dto);
    return response.data;
  },
};