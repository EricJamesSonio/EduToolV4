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
    const res = await client.get<SchoolYear[]>("/school-years");
    return res.data;
  },
  create: async (data: CreateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.post<SchoolYear>("/school-years", data);
    return res.data;
  },
  update: async (id: string, data: UpdateSchoolYearRequest): Promise<SchoolYear> => {
    const res = await client.patch<SchoolYear>(`/school-years/${id}`, data);
    return res.data;
  },
  activate: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<SchoolYear>(`/school-years/${id}/activate`);
    return res.data;
  },
  end: async (id: string): Promise<SchoolYear> => {
    const res = await client.patch<SchoolYear>(`/school-years/${id}/end`);
    return res.data;
  },
};