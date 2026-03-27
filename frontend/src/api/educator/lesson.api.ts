import client from "@/api/client";
import type { Lesson, LessonConcept } from "@/types/educator/lesson.types";

export interface CreateLessonRequest {
  title: string;
  description?: string;
  weekNumber: number;
  subIndex: number;
  detail: string; // min 10 words
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  weekNumber?: number;
  subIndex?: number;
  detail?: string;
}

export const lessonApi = {
  getAll: async (classId: string, weekNumber?: number): Promise<Lesson[]> => {
    const res = await client.get<Lesson[]>(`/classes/${classId}/lessons`, {
      params: weekNumber ? { weekNumber } : undefined,
    });
    return res.data;
  },
  getOne: async (classId: string, lessonId: string): Promise<Lesson> => {
    const res = await client.get<Lesson>(
      `/classes/${classId}/lessons/${lessonId}`
    );
    return res.data;
  },
  create: async (classId: string, data: CreateLessonRequest): Promise<Lesson> => {
    const res = await client.post<Lesson>(`/classes/${classId}/lessons`, data);
    return res.data;
  },
  update: async (
    classId: string,
    lessonId: string,
    data: UpdateLessonRequest
  ): Promise<Lesson> => {
    const res = await client.patch<Lesson>(
      `/classes/${classId}/lessons/${lessonId}`,
      data
    );
    return res.data;
  },
  delete: async (classId: string, lessonId: string): Promise<void> => {
    await client.delete(`/classes/${classId}/lessons/${lessonId}`);
  },
  getConcept: async (classId: string, lessonId: string): Promise<LessonConcept> => {
    const res = await client.get<LessonConcept>(
      `/classes/${classId}/lessons/${lessonId}/concept`
    );
    return res.data;
  },
  retriggerExtraction: async (
    classId: string,
    lessonId: string,
    detail: string
  ): Promise<{ success: true; message: string }> => {
    const res = await client.post<{ success: true; message: string }>(
      `/classes/${classId}/lessons/${lessonId}/re-extract`,
      { detail }
    );
    return res.data;
  },
};