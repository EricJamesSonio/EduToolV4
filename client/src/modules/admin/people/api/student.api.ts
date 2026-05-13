import { apiClient } from '@/api/apiClient';
import type {
  CreateStudentDto,
  ResetStudentPasswordResponse,
  Student,
  StudentQueryParams,
  StudentWithPassword,
  UpdateStudentDto,
  UpdateStudentStatusDto,
} from '../types/student.types';

const cleanParams = (params: StudentQueryParams) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  );
};

export const studentApi = {
  getAll: async (params: StudentQueryParams = {}): Promise<Student[]> => {
    const response = await apiClient.get('/students', {
      params: cleanParams(params),
    });
    return response.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  create: async (data: CreateStudentDto): Promise<StudentWithPassword> => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    const response = await apiClient.patch(`/students/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateStudentStatusDto): Promise<Student> => {
    const response = await apiClient.patch(`/students/${id}/status`, data);
    return response.data;
  },

  resetPassword: async (id: string): Promise<ResetStudentPasswordResponse> => {
    const response = await apiClient.post(`/students/${id}/reset-password`);
    return response.data;
  },
};
