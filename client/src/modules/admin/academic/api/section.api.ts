// ===== File: client\src\modules\admin\academic\api\section.api.ts =====
import { apiClient } from '@/api/apiClient';

export interface Section {
  id: string;
  org_id: string;
  level_id: string;
  school_year_id: string;
  course_id: string | null;
  strand_id: string | null;
  name: string;
  capacity: number;
  studentCount: number;
}

export interface CreateSectionDto {
  levelId: string;
  schoolYearId: string;
  name: string;
  capacity: number;
  courseId?: string;
  strandId?: string;
}

export interface UpdateSectionDto {
  name?: string;
  capacity?: number;
}

export const sectionApi = {
  getByLevel: async (schoolYearId: string, levelId: string): Promise<Section[]> => {
    const response = await apiClient.get('/sections', {
      params: { schoolYearId, levelId },
    });
    return response.data;
  },

  create: async (data: CreateSectionDto): Promise<Section> => {
    const response = await apiClient.post('/sections', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSectionDto): Promise<Section> => {
    const response = await apiClient.patch(`/sections/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/sections/${id}`);
  },
};