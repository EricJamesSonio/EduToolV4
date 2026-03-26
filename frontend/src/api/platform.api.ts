import client from "./client";
import type { AdminAccount } from "@/types/platform.types";
import type { PaginatedResponse } from "@/types/api.types";

export interface CreateAdminRequest {
  email: string;
  fullName?: string;
}

export interface CreateAdminResponse extends AdminAccount {
  password: string; // one-time only
}

export interface ResetAdminPasswordResponse {
  id: string;
  email: string;
  status: string;
  password: string; // one-time only
}

export interface GetAdminsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const platformApi = {
  getAdmins: async (
    query?: GetAdminsQuery
  ): Promise<PaginatedResponse<AdminAccount>> => {
    const res = await client.get<PaginatedResponse<AdminAccount>>(
      "/platform/admins",
      { params: query }
    );
    return res.data;
  },

  getAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.get<AdminAccount>(`/platform/admins/${id}`);
    return res.data;
  },

  createAdmin: async (
    data: CreateAdminRequest
  ): Promise<CreateAdminResponse> => {
    const res = await client.post<CreateAdminResponse>(
      "/platform/admins",
      data
    );
    return res.data;
  },

  blockAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.patch<AdminAccount>(
      `/platform/admins/${id}/block`
    );
    return res.data;
  },

  unblockAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.patch<AdminAccount>(
      `/platform/admins/${id}/unblock`
    );
    return res.data;
  },

  resetAdminPassword: async (
    id: string
  ): Promise<ResetAdminPasswordResponse> => {
    const res = await client.post<ResetAdminPasswordResponse>(
      `/platform/admins/${id}/reset-password`
    );
    return res.data;
  },
};