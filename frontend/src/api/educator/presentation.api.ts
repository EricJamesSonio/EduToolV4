import apiClient from "@/api/client";
import type {
  Presentation,
  Slide,
  CreatePresentationRequest,
  UpdatePresentationRequest,
  GenerateSlidesRequest,
} from "@/types/educator/presentation.types";

function unwrap<T>(data: T | { data: T }): T {
  if (data && typeof data === "object" && "data" in data) return (data as { data: T }).data;
  return data as T;
}

function mapPresentation(raw: Record<string, unknown>): Presentation {
  return {
    id: raw.id as string,
    orgId: (raw.org_id ?? raw.orgId) as string,
    classId: (raw.class_id ?? raw.classId) as string,
    lessonId: (raw.lesson_id ?? raw.lessonId) as string,
    title: raw.title as string,
    template: raw.template as string,
    settings: (raw.settings ?? {}) as Record<string, any>,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt) as string,
    slides: ((raw.slides ?? []) as Record<string, unknown>[]).map(mapSlide),
  };
}

function mapSlide(raw: Record<string, unknown>): Slide {
  return {
    id: raw.id as string,
    presentationId: (raw.presentation_id ?? raw.presentationId) as string,
    slideNumber: (raw.slide_number ?? raw.slideNumber) as number,
    title: (raw.title as string) ?? null,
    content: raw.content as string,
    lessonSection: (raw.lesson_section ?? raw.lessonSection) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

export const presentationApi = {
  getByLesson: async (classId: string, lessonId: string): Promise<Presentation | null> => {
    const { data } = await apiClient.get(`/educator/classes/${classId}/presentations/lesson/${lessonId}`);
    const raw = unwrap<Record<string, unknown> | null>(data);
    return raw ? mapPresentation(raw) : null;
  },

  getAll: async (classId: string): Promise<Presentation[]> => {
  getAll: async (classId: string): Promise<Presentation[]> => {
    const { data } = await apiClient.get(`/educator/classes/${classId}/presentations`);
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapPresentation);
  },

  getOne: async (classId: string, id: string): Promise<Presentation> => {
    const { data } = await apiClient.get(`/educator/classes/${classId}/presentations/${id}`);
    return mapPresentation(unwrap<Record<string, unknown>>(data));
  },

  create: async (classId: string, body: CreatePresentationRequest): Promise<Presentation> => {
    const { data } = await apiClient.post(`/educator/classes/${classId}/presentations`, body);
    return mapPresentation(unwrap<Record<string, unknown>>(data));
  },

  update: async (classId: string, id: string, body: UpdatePresentationRequest): Promise<Presentation> => {
    const { data } = await apiClient.patch(`/educator/classes/${classId}/presentations/${id}`, body);
    return mapPresentation(unwrap<Record<string, unknown>>(data));
  },

  delete: async (classId: string, id: string): Promise<void> => {
    await apiClient.delete(`/educator/classes/${classId}/presentations/${id}`);
  },

  generateSlides: async (classId: string, id: string, body: GenerateSlidesRequest): Promise<Slide[]> => {
    const { data } = await apiClient.post(`/educator/classes/${classId}/presentations/${id}/slides`, body);
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapSlide);
  },

  autoGenerate: async (classId: string, id: string): Promise<Slide[]> => {
    const { data } = await apiClient.post(`/educator/classes/${classId}/presentations/${id}/auto-generate`);
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapSlide);
  },
};
