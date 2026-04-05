import client from "@/api/client";
import type { Organization } from "@/types/admin/organization.types";
import type { AxiosError } from "axios";

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  programs?: string[];
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export const organizationApi = {
  getOrg: async (): Promise<Organization | null> => {
    try {
      const res = await client.get<{ success: boolean; data: Organization }>(
        "/organization"
      );
      return res.data.data;
    } catch (err) {
      if ((err as AxiosError)?.response?.status === 404) return null;
      throw err;
    }
  },

  createOrg: async (data: CreateOrganizationRequest): Promise<Organization> => {
    const res = await client.post<{ success: boolean; data: Organization }>(
      "/organization",
      data
    );
    return res.data.data;
  },

  updateOrg: async (data: UpdateOrganizationRequest): Promise<Organization> => {
    const res = await client.patch<{ success: boolean; data: Organization }>(
      "/organization",
      data
    );
    return res.data.data;
  },
};