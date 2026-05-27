import client from "./client";
import type { AdminAccount } from "@/types/platform.types";
import type { PaginatedResponse } from "@/types/api.types";

export interface CreateAdminRequest {
  email: string;
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

export interface SchoolOrg {
  id: string;
  name: string;
  description: string | null;
  emailExtension: string | null;
  admin: {
    id: string;
    email: string;
    status: string;
    fullName: string | null;
  } | null;
}

export interface GetSchoolsQuery {
  search?: string;
  page?: number;
  limit?: number;
}



export const platformApi = {
  getAdmins: async (query?: GetAdminsQuery): Promise<PaginatedResponse<AdminAccount>> => {
    const res = await client.get<{ success: boolean; data: PaginatedResponse<AdminAccount> }>(
      "/platform/admins",
      { params: query }
    );
    return res.data.data; // unwrap envelope
  },

  getAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.get<{ success: boolean; data: AdminAccount }>(`/platform/admins/${id}`);
    return res.data.data;
  },

  createAdmin: async (data: CreateAdminRequest): Promise<CreateAdminResponse> => {
    const res = await client.post<{ success: boolean; data: CreateAdminResponse }>(
      "/platform/admins",
      data
    );
    return res.data.data;
  },

  blockAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.patch<{ success: boolean; data: AdminAccount }>(
      `/platform/admins/${id}/block`
    );
    return res.data.data;
  },

  unblockAdmin: async (id: string): Promise<AdminAccount> => {
    const res = await client.patch<{ success: boolean; data: AdminAccount }>(
      `/platform/admins/${id}/unblock`
    );
    return res.data.data;
  },

  resetAdminPassword: async (id: string): Promise<ResetAdminPasswordResponse> => {
    const res = await client.post<{ success: boolean; data: ResetAdminPasswordResponse }>(
      `/platform/admins/${id}/reset-password`
    );
    return res.data.data;
  },

getSchools: async (query?: GetSchoolsQuery): Promise<PaginatedResponse<SchoolOrg>> => {
  const res = await client.get<{ success: boolean; data: PaginatedResponse<SchoolOrg> }>(
    "/platform/schools",
    { params: query }
  );
  return res.data.data;
},
};