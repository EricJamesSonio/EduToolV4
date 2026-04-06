import client from "@/api/client";
import type { Section } from "@/types/admin/section.types";

export interface CreateSectionRequest {
  levelId:      string;
  schoolYearId: string;
  name:         string;
  capacity:     number;
}

export interface UpdateSectionRequest {
  name?:     string;
  capacity?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const sectionApi = {
  getAll: async (schoolYearId: string, levelId?: string): Promise<Section[]> => {
    const res = await client.get<ApiResponse<Section[]>>("/sections", {
      params: { schoolYearId, ...(levelId ? { levelId } : {}) },
    });
    return res.data.data ?? [];
  },

  create: async (data: CreateSectionRequest): Promise<Section> => {
    const res = await client.post<ApiResponse<Section>>("/sections", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateSectionRequest): Promise<Section> => {
    const res = await client.patch<ApiResponse<Section>>(`/sections/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/sections/${id}`);
  },
};