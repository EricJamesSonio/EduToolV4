// Dashboard API
// API endpoints for dashboard statistics, academic context, and alerts

import apiClient from '@/api/apiClient';

export interface DashboardStats {
  totalStudents: number;
  totalEducators: number;
  activeClasses: number;
  programs: number;
  activeSchoolYear: string;
  pendingGradeSubmissions: number;
  sections: number;
  pendingTasks: number;
}

export interface AcademicContext {
  schoolYear: string;
  semester: string;
  gradingPeriod: string;
  gradeLockStatus: 'enabled' | 'disabled';
  gradeLockDate?: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  count?: number;
  actionUrl?: string;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/statistics');
    return response.data;
  },

  // Get academic context information
  getAcademicContext: async (): Promise<AcademicContext> => {
    const response = await apiClient.get('/dashboard/academic-context');
    return response.data;
  },

  // Get alerts and important notices
  getAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get('/dashboard/alerts');
    return response.data;
  },
};
