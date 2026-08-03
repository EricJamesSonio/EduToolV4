import client from "@/api/client";
import type { Section } from "@/types/admin/section.types";
import type { PaginatedResponse } from "@/types/api.types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SELECT_LIMIT = 5000;

export interface CreateSectionRequest {
  levelId:      string;
  schoolYearId: string;
  courseId?:    string;
  strandId?:    string;
  name:         string;
  capacity:     number;
}

export interface UpdateSectionRequest {
  name?:     string;
  capacity?: number;
}

export interface GetSectionsQuery {
  schoolYearId?: string;
  levelId?:      string;
  programId?:    string;
  courseId?:     string;
  strandId?:     string;
  search?:       string;
  page?:         number;
  limit?:        number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const sectionApi = {
  getPage: async (
    params?: GetSectionsQuery,
  ): Promise<PaginatedResponse<Section>> => {
    const query = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== "",
          ),
        )
      : undefined;

    const res = await client.get<ApiResponse<PaginatedResponse<Section>>>(
      "/sections",
      { params: query },
    );
    return res.data.data ?? { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } };
  },

  getAll: async (
    schoolYearId: string,
    levelId?:     string,
    courseId?:    string,
    strandId?:    string,
  ): Promise<Section[]> => {
    const result = await sectionApi.getPage({
      schoolYearId,
      ...(levelId  ? { levelId }  : {}),
      ...(courseId ? { courseId } : {}),
      ...(strandId ? { strandId } : {}),
      limit: MAX_SELECT_LIMIT,
    });
    return result.data;
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