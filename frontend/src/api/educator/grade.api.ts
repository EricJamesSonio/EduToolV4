import apiClient from "@/api/client";
import type { TermGrades } from "@/types/educator/grade.types";

export interface ManualScoreDto {
  category: string;
  score: number;
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
};