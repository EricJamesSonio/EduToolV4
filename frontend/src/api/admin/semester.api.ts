import client from "@/api/client";
import type { Semester } from "@/types/admin/semester.types";

export interface TermInput {
  id?: string;
  name: string;
  orderIndex: number;
  startDate: string;
  endDate: string;
}

export interface CreateSemesterRequest {
  schoolYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: TermInput[];
}

export interface UpdateSemesterRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  terms?: TermInput[];
}

export const semesterApi = {
  getAll: async (): Promise<Semester[]> => {
    const res = await client.get<Semester[]>("/semester-settings");
    return res.data;
  },
  create: async (data: CreateSemesterRequest): Promise<Semester> => {
    const res = await client.post<Semester>("/semester-settings", data);
    return res.data;
  },
  update: async (id: string, data: UpdateSemesterRequest): Promise<Semester> => {
    const res = await client.patch<Semester>(`/semester-settings/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/semester-settings/${id}`);
  },
};