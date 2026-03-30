import client from "@/api/client";
import type { SchoolYear } from "@/types/admin/school-year.types";

export interface CreateSchoolYearRequest {
  name: string;
}

export interface UpdateSchoolYearRequest {
  name: string;
}

export const schoolYearApi = {
  getAll: async (): Promise<SchoolYear[]> => {
    const res = await client.get<{ success: boolean; data: SchoolYear[] }>(
      "/school-years"
    );
    return res.data.data;
  },

  create: async (data: CreateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.post<{ success: boolean; data: SchoolYear }>(
      "/school-years",
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: UpdateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(
      `/school-years/${id}`,
      data
    );
    return res.data.data;
  },

  activate: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(
      `/school-years/${id}/activate`
    );
    return res.data.data;
  },

  end: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(
      `/school-years/${id}/end`
    );
    return res.data.data;
  },
};