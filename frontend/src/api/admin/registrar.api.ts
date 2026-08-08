import client from "@/api/client";
import type { Registrar } from "@/types/admin/registrar.types";
import type { PaginatedResponse } from "@/types/api.types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SELECT_LIMIT = 5000;

export interface CreateRegistrarRequest {
  username: string;
}

export interface CreateRegistrarResponse extends Registrar {
  plainPassword: string;
}

export interface GetRegistrarsQuery {
  search?: string;
  status?: string;
  page?:   number;
  limit?:  number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const registrarApi = {
  getPage: async (query?: GetRegistrarsQuery): Promise<PaginatedResponse<Registrar>> => {
    const params = query
      ? Object.fromEntries(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;
    const res = await client.get<ApiResponse<PaginatedResponse<Registrar>>>("/registrars", { params });
    return res.data.data;
  },

  getAll: async (search?: string): Promise<Registrar[]> => {
    const result = await registrarApi.getPage({ search: search || undefined, limit: MAX_SELECT_LIMIT });
    return result.data;
  },

  create: async (data: CreateRegistrarRequest): Promise<CreateRegistrarResponse> => {
    const res = await client.post<ApiResponse<CreateRegistrarResponse>>("/registrars", data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Registrar> => {
    const res = await client.patch<ApiResponse<Registrar>>(`/registrars/${id}/status`, { status });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/registrars/${id}`);
  },

  resetPassword: async (id: string): Promise<{ id: string; plainPassword: string }> => {
    const res = await client.post<ApiResponse<{ id: string; plainPassword: string }>>(
      `/registrars/${id}/reset-password`
    );
    return res.data.data;
  },
};