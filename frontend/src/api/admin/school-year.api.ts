// frontend/src/api/admin/school-year.api.ts

import client from "@/api/client";
import type {
  ReadinessSummary,
  SchoolYear,
  SchoolYearReadiness,
} from "@/types/admin/school-year.types";

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

  remove: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    const res = await client.delete<{ success: boolean; data: { id: string; deleted: boolean } }>(
      `/school-years/${id}`,
    );
    return res.data.data;
  },

  getReadinessSummaries: async (): Promise<Record<string, ReadinessSummary>> => {
    const res = await client.get<{ success: boolean; data: Record<string, ReadinessSummary> }>(
      "/school-years/readiness",
    );
    return res.data.data;
  },

  getReadiness: async (id: string): Promise<SchoolYearReadiness> => {
    const res = await client.get<{ success: boolean; data: SchoolYearReadiness }>(
      `/school-years/${id}/readiness`,
    );
    return res.data.data;
  },
};