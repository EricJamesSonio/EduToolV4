// frontend/src/api/admin/school-year.api.ts

import client from "@/api/client";
import type { SchoolYear } from "@/types/admin/school-year.types";

export interface CreateSchoolYearRequest {
  name:                   string;
  start_date?:            string;
  end_date?:              string;
  confirm_short_duration?: boolean;
}

export interface UpdateSchoolYearRequest {
  name?:                  string;
  start_date?:            string | null;
  end_date?:              string | null;
  confirm_short_duration?: boolean;
}

export const schoolYearApi = {
  getAll: async (): Promise<SchoolYear[]> => {
    const res = await client.get<{ success: boolean; data: SchoolYear[] }>("/school-years");
    return res.data.data;
  },

  getById: async (id: string): Promise<SchoolYear | null> => {
    const res = await client.get<{ success: boolean; data: SchoolYear[] }>("/school-years");
    return res.data.data.find((y) => y.id === id) ?? null;
  },

  create: async (data: CreateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.post<{ success: boolean; data: SchoolYear }>("/school-years", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(`/school-years/${id}`, data);
    return res.data.data;
  },

  activate: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(`/school-years/${id}/activate`);
    return res.data.data;
  },

  end: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<{ success: boolean; data: SchoolYear }>(`/school-years/${id}/end`);
    return res.data.data;
  },
};