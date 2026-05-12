// Course API
// API client for course-related operations

import { apiClient } from './apiClient';

export const courseApi = {
  getCoursesByProgram: (programId: string) => {
    return apiClient.get(`/programs/${programId}/courses`);
  },
  
  createCourse: (data: any) => {
    return apiClient.post('/courses', data);
  },
  
  updateCourse: (id: string, data: any) => {
    return apiClient.patch(`/courses/${id}`, data);
  },
  
  deleteCourse: (id: string) => {
    return apiClient.delete(`/courses/${id}`);
  }
};
