import apiClient from "@/api/client";
import { Lesson } from "@/types/educator/lesson.types";

export interface CreateLessonRequest {
  title: string;
  description?: string;
  weekNumber: number;
  subIndex: number; // ← added
  detail: string;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  weekNumber?: number;
  subIndex?: number; // ← added
  detail?: string;
}

export const lessonApi = {
  getAll: async (classId: string, weekNumber?: number): Promise<Lesson[]> => {
    const { data } = await apiClient.get(`/educator/classes/${classId}/lessons`, {
      params: weekNumber !== undefined ? { weekNumber } : undefined,
    });
    // If backend wraps in { data: [...] }, unwrap it
    return Array.isArray(data) ? data : (data.data ?? []);
  },

  getOne: async (classId: string, lessonId: string): Promise<Lesson> => {
    const { data } = await apiClient.get(
      `/educator/classes/${classId}/lessons/${lessonId}`
    );
    return data;
  },

  create: async (classId: string, body: CreateLessonRequest): Promise<Lesson> => {
    const { data } = await apiClient.post(
      `/educator/classes/${classId}/lessons`,
      body
    );
    return data;
  },

  update: async (
    classId: string,
    lessonId: string,
    body: UpdateLessonRequest
  ): Promise<Lesson> => {
    const { data } = await apiClient.patch(
      `/educator/classes/${classId}/lessons/${lessonId}`,
      body
    );
    return data;
  },

  delete: async (classId: string, lessonId: string): Promise<void> => {
    await apiClient.delete(`/educator/classes/${classId}/lessons/${lessonId}`);
  },

  triggerExtraction: async (classId: string, lessonId: string): Promise<void> => {
    await apiClient.post(
      `/educator/classes/${classId}/lessons/${lessonId}/re-extract` // ← fixed
    );
  },
};