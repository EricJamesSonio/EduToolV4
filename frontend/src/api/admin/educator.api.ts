import client from "@/api/client";
import type { Educator } from "@/types/admin/educator.types";

export interface CreateEducatorRequest {
  fullName: string;
  email: string;
}

export interface CreateEducatorResponse extends Educator {
  plainPassword: string; // show once
}

export interface UpdateEducatorRequest {
  fullName?: string;
  email?: string;
}

export const educatorApi = {
  getAll: async (search?: string): Promise<Educator[]> => {
    const res = await client.get<Educator[]>("/educators", {
      params: search ? { search } : undefined,
    });
    return res.data;
  },
  getOne: async (id: string): Promise<Educator> => {
    const res = await client.get<Educator>(`/educators/${id}`);
    return res.data;
  },
  create: async (data: CreateEducatorRequest): Promise<CreateEducatorResponse> => {
    const res = await client.post<CreateEducatorResponse>("/educators", data);
    return res.data;
  },
  update: async (id: string, data: UpdateEducatorRequest): Promise<Educator> => {
    const res = await client.patch<Educator>(`/educators/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/educators/${id}`);
  },
  resetPassword: async (id: string): Promise<{ id: string; plainPassword: string }> => {
    const res = await client.post<{ id: string; plainPassword: string }>(
      `/educators/${id}/reset-password`
    );
    return res.data;
  },
};