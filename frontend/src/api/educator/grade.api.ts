import apiClient from "@/api/client";
import type { TermGrades } from "@/types/educator/grade.types";

export interface ManualScoreDto {
  category: string;
  score: number;
}

export interface AssessmentStatusOverrideDto {
  overrideStatus: "MISSING" | "EXEMPTED";
  reason?: string | null;
}

export interface AssessmentStatusInfo {
  assessmentId: string;
  title?: string | null;
  effectiveDate?: string | null;
  status: string;
  countsTowardGrade: boolean;
  reason: string;
  overrideId?: string;
  overrideStatus?: "MISSING" | "EXEMPTED";
  overrideReason?: string | null;
  overriddenBy?: string;
  overriddenAt?: string;
}

export interface AssessmentStatusOverrideResult {
  overrideId: string;
  overrideStatus: "MISSING" | "EXEMPTED";
  overrideReason: string | null;
  overriddenBy: string;
  overriddenAt: string;
}

export interface TermOption {
  termId: string;
  termName: string;
  semesterName: string;
}

type Envelope<T> = { success: boolean; data: T };

export const gradeApi = {
  getByClass: async (classId: string): Promise<TermGrades[]> => {
    const { data } = await apiClient.get<Envelope<TermGrades[]>>(
      `/classes/${classId}/grades`
    );
    return data.data;
  },

  getTermOptions: async (classId: string): Promise<TermOption[]> => {
    const { data } = await apiClient.get<Envelope<TermOption[]>>(
      `/classes/${classId}/grades/term-options`
    );
    return data.data;
  },

  getByTerm: async (classId: string, termId: string): Promise<TermGrades> => {
    const { data } = await apiClient.get<Envelope<TermGrades>>(
      `/classes/${classId}/grades/${termId}`
    );
    return data.data;
  },

  compute: async (
    classId: string,
    termId: string
  ): Promise<{ computed: number; message: string }> => {
    const { data } = await apiClient.post<
      Envelope<{ computed: number; message: string }>
    >(`/classes/${classId}/grades/${termId}/compute`);
    return data.data;
  },

  setManualScore: async (
    classId: string,
    termId: string,
    studentId: string,
    dto: ManualScoreDto
  ): Promise<{ id: string; category: string; score: number }> => {
    const { data } = await apiClient.patch<
      Envelope<{ id: string; category: string; score: number }>
    >(
      `/classes/${classId}/grades/${termId}/students/${studentId}/manual`,
      dto
    );
    return data.data;
  },

  publishStudent: async (
    classId: string,
    termId: string,
    studentId: string,
  ): Promise<void> => {
    await apiClient.patch(
      `/classes/${classId}/grades/${termId}/students/${studentId}/publish`,
    );
  },

  unlockStudent: async (
    classId: string,
    termId: string,
    studentId: string,
  ): Promise<void> => {
    await apiClient.patch(
      `/classes/${classId}/grades/${termId}/students/${studentId}/unlock`,
    );
  },

  getAssessmentStatuses: async (
    classId: string,
    studentId: string,
  ): Promise<AssessmentStatusInfo[]> => {
    const { data } = await apiClient.get<Envelope<AssessmentStatusInfo[]>>(
      `/classes/${classId}/grades/students/${studentId}/assessments/status`
    );
    return data.data;
  },

  setAssessmentStatusOverride: async (
    classId: string,
    studentId: string,
    assessmentId: string,
    dto: AssessmentStatusOverrideDto,
  ): Promise<AssessmentStatusOverrideResult> => {
    const { data } = await apiClient.post<Envelope<AssessmentStatusOverrideResult>>(
      `/classes/${classId}/grades/students/${studentId}/assessments/${assessmentId}/override`,
      dto
    );
    return data.data;
  },

  deleteAssessmentStatusOverride: async (
    classId: string,
    studentId: string,
    assessmentId: string,
  ): Promise<{ deleted: number }> => {
    const { data } = await apiClient.delete<Envelope<{ deleted: number }>>(
      `/classes/${classId}/grades/students/${studentId}/assessments/${assessmentId}/override`
    );
    return data.data;
  },
};