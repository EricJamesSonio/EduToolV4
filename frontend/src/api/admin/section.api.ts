import client from "@/api/client";
import type { Section } from "@/types/admin/section.types";

export interface CreateSectionRequest {
  levelId: string;
  name: string;
  capacity: number;
}

export interface UpdateSectionRequest {
  name?: string;
  capacity?: number;
}

export const sectionApi = {
  getAll: async (levelId?: string): Promise<Section[]> => {
    const res = await client.get<Section[]>("/sections", {
      params: levelId ? { levelId } : undefined,
    });
    return res.data;
  },
  create: async (data: CreateSectionRequest): Promise<Section> => {
    const res = await client.post<Section>("/sections", data);
    return res.data;
  },
  update: async (id: string, data: UpdateSectionRequest): Promise<Section> => {
    const res = await client.patch<Section>(`/sections/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/sections/${id}`);
  },
};