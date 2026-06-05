import client from "@/api/client";
import type { Educator } from "@/types/admin/educator.types";

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

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const educatorApi = {
  getAll: async (search?: string): Promise<Educator[]> => {
    const res = await client.get<ApiResponse<Educator[]>>("/educators", {
      params: search ? { search } : undefined,
    });
    return res.data.data;
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

  bulkCreate: async (names: string[]): Promise<BulkCreateEducatorResult[]> => {
    const res = await client.post<ApiResponse<BulkCreateEducatorResult[]>>(
      "/educators/bulk", { names }
    );
    return res.data.data;
  },
};