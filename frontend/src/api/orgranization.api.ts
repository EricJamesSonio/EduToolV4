import client from "@/api/client";
import type { Organization } from "@/types/admin/organization.types";

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export const organizationApi = {
  getOrg: async (): Promise<Organization> => {
    const res = await client.get<Organization>("/organization");
    return res.data;
  },

  updateOrg: async (data: UpdateOrganizationRequest): Promise<Organization> => {
    const res = await client.patch<Organization>("/organization", data);
    return res.data;
  },
};