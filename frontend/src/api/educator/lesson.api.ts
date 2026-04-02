import apiClient from "@/api/client";
import { Lesson } from "@/types/educator/lesson.types";

export interface CreateLessonRequest {
  title: string;
  description?: string;
  weekNumber: number;
  subIndex: number;
  detail: string;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  weekNumber?: number;
  subIndex?: number;
  detail?: string;
}

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

function mapLesson(raw: Record<string, unknown>): Lesson {
  return {
    id: raw.id as string,
    classId: (raw.class_id ?? raw.classId) as string,
    title: raw.title as string,
    description: (raw.description ?? null) as string | null,
    detail: raw.detail as string,
    weekNumber: (raw.week_number ?? raw.weekNumber) as number,
    subIndex: (raw.sub_index ?? raw.subIndex) as number,
    conceptBuild: (raw.conceptBuild ?? null) as Lesson["conceptBuild"],
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? raw.createdAt) as string,
  };
}

export const lessonApi = {
  getAll: async (classId: string, weekNumber?: number): Promise<Lesson[]> => {
    const { data } = await apiClient.get(`/educator/classes/${classId}/lessons`, {
      params: weekNumber !== undefined ? { weekNumber } : undefined,
    });
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapLesson);
  },

  getOne: async (classId: string, lessonId: string): Promise<Lesson> => {
    const { data } = await apiClient.get(
      `/educator/classes/${classId}/lessons/${lessonId}`
    );
    return mapLesson(unwrap<Record<string, unknown>>(data));
  },

  create: async (classId: string, body: CreateLessonRequest): Promise<Lesson> => {
    const { data } = await apiClient.post(
      `/educator/classes/${classId}/lessons`,
      body
    );
    return mapLesson(unwrap<Record<string, unknown>>(data));
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
    return mapLesson(unwrap<Record<string, unknown>>(data));
  },

  delete: async (classId: string, lessonId: string): Promise<void> => {
    await apiClient.delete(`/educator/classes/${classId}/lessons/${lessonId}`);
  },

  triggerExtraction: async (classId: string, lessonId: string): Promise<void> => {
    await apiClient.post(
      `/educator/classes/${classId}/lessons/${lessonId}/re-extract`
    );
  },
};