// client/src/modules/admin/system/api/semester-template.api.ts

import { apiClient } from '@/api/apiClient';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignSemesterTemplateDto,
  SaveTermDatesDto,
} from '../types/semester-template.types';

export const semesterTemplateApi = {
  // ── Templates ──────────────────────────────────────────────────────────────

  /** GET /semester-templates?schoolYearId=... */
  getBySchoolYear: async (schoolYearId: string): Promise<SemesterTemplate[]> => {
    const response = await apiClient.get('/semester-templates', {
      params: { schoolYearId },
    });
    return response.data;
  },

  /** GET /semester-templates/for-org */
  getAllForOrg: async (): Promise<SemesterTemplate[]> => {
    const response = await apiClient.get('/semester-templates/for-org');
    return response.data;
  },

  /** GET /semester-templates/:id */
  getById: async (id: string): Promise<SemesterTemplate> => {
    const response = await apiClient.get(`/semester-templates/${id}`);
    return response.data;
  },

  /** POST /semester-templates */
  create: async (data: CreateSemesterTemplateDto): Promise<SemesterTemplate> => {
    const response = await apiClient.post('/semester-templates', data);
    return response.data;
  },

  /** PATCH /semester-templates/:id */
  update: async (id: string, data: UpdateSemesterTemplateDto): Promise<SemesterTemplate> => {
    const response = await apiClient.patch(`/semester-templates/${id}`, data);
    return response.data;
  },

  /** DELETE /semester-templates/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/semester-templates/${id}`);
  },

  // ── Assignments ────────────────────────────────────────────────────────────

  /** GET /semester-templates/assignments/by-school-year?schoolYearId=... */
  getAssignmentsBySchoolYear: async (
    schoolYearId: string,
  ): Promise<SemesterTemplateAssignment[]> => {
    const response = await apiClient.get(
      '/semester-templates/assignments/by-school-year',
      { params: { schoolYearId } },
    );
    return response.data;
  },

  /** POST /semester-templates/assignments */
  assign: async (data: AssignSemesterTemplateDto): Promise<SemesterTemplateAssignment> => {
    const response = await apiClient.post('/semester-templates/assignments', data);
    return response.data;
  },

  /** DELETE /semester-templates/assignments/:programId */
  removeAssignment: async (programId: string): Promise<void> => {
    await apiClient.delete(`/semester-templates/assignments/${programId}`);
  },

  /** POST /semester-templates/assignments/:programId/term-dates */
  saveTermDates: async (
    programId: string,
    data: SaveTermDatesDto,
  ): Promise<void> => {
    await apiClient.post(
      `/semester-templates/assignments/${programId}/term-dates`,
      data,
    );
  },
};