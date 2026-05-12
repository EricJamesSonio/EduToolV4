// Course API
// API client for course-related operations

import { apiClient } from './apiClient';
import type { Course, CreateCourseDto, UpdateCourseDto } from '../types/course.types';

export const courseApi = {
  getAll: async (params: { schoolYearId: string; programId?: string }): Promise<Course[]> => {
    const response = await apiClient.get('/courses', { params });
    return response.data;
  },

  getCoursesByProgram: async (schoolYearId: string, programId: string): Promise<Course[]> => {
    const response = await apiClient.get('/courses', {
      params: { schoolYearId, programId },
    });
    return response.data;
  },

  createCourse: async (data: CreateCourseDto): Promise<Course> => {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: UpdateCourseDto): Promise<Course> => {
    const response = await apiClient.patch(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },
};
