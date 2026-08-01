import client from "@/api/client";
import type { Educator } from "@/types/admin/educator.types";
import type { PaginatedResponse } from "@/types/api.types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SELECT_LIMIT = 5000;

export interface CreateEducatorRequest {
  fullName:  string;
  emailName: string;
}

export interface CreateEducatorResponse extends Educator {
  plainPassword: string; // show once
}

export interface BulkCreateEducatorResult {
  fullName:     string;
  email:        string;
  educatorId:   string;
  plainPassword: string;
}

export interface UpdateEducatorRequest {
  fullName?:     string;
  email?:        string;
  profileImage?: string;
}

export interface GetEducatorsQuery {
  search?: string;
  status?: string;
  page?:   number;
  limit?:  number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const educatorApi = {
  getPage: async (query?: GetEducatorsQuery): Promise<PaginatedResponse<Educator>> => {
    const params = query
      ? Object.fromEntries(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;
    const res = await client.get<ApiResponse<PaginatedResponse<Educator>>>("/educators", { params });
    return res.data.data;
  },

  getAll: async (search?: string): Promise<Educator[]> => {
    const result = await educatorApi.getPage({ search: search || undefined, limit: MAX_SELECT_LIMIT });
    return result.data;
  },

  getOne: async (id: string): Promise<Educator> => {
    const res = await client.get<ApiResponse<Educator>>(`/educators/${id}`);
    return res.data.data;
  },

  create: async (data: CreateEducatorRequest): Promise<CreateEducatorResponse> => {
    const res = await client.post<ApiResponse<CreateEducatorResponse>>("/educators", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateEducatorRequest): Promise<Educator> => {
    const res = await client.patch<ApiResponse<Educator>>(`/educators/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/educators/${id}`);
  },

  resetPassword: async (id: string): Promise<{ id: string; plainPassword: string }> => {
    const res = await client.post<ApiResponse<{ id: string; plainPassword: string }>>(
      `/educators/${id}/reset-password`
    );
    return res.data.data;
  },

  bulkCreate: async (entries: { fullName: string; id: string }[]): Promise<BulkCreateEducatorResult[]> => {
    const res = await client.post<ApiResponse<BulkCreateEducatorResult[]>>(
      "/educators/bulk", { entries }
    );
    return res.data.data;
  },
};