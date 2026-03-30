import client from "@/api/client";
import type { Semester } from "@/types/admin/semester.types";

// ✅ Request types
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

//
// ✅ 🔥 Backend Response Types (FIX FOR ESLINT)
//
interface TermResponse {
  id: string;
  name: string;
  order_index: number;
  start_date: string;
  end_date: string;
}

interface SemesterResponse {
  id: string;
  school_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  terms: TermResponse[];
}

//
// ✅ 🔥 MAPPER (NOW FULLY TYPED)
//
const mapSemester = (data: SemesterResponse): Semester => ({
  id: data.id,
  schoolYearId: data.school_year_id,
  name: data.name,
  startDate: data.start_date,
  endDate: data.end_date,
  terms: data.terms?.map((t) => ({
    id: t.id,
    name: t.name,
    orderIndex: t.order_index,
    startDate: t.start_date,
    endDate: t.end_date,
  })) ?? [],
});

export const semesterApi = {
  getAll: async (): Promise<Semester[]> => {
    const res = await client.get<SemesterResponse[]>("/semester-settings");
    return res.data.map(mapSemester);
  },

  create: async (data: CreateSemesterRequest): Promise<Semester> => {
    const res = await client.post<SemesterResponse>("/semester-settings", data);
    return mapSemester(res.data);
  },

  update: async (id: string, data: UpdateSemesterRequest): Promise<Semester> => {
    const res = await client.patch<SemesterResponse>(`/semester-settings/${id}`, data);
    return mapSemester(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/semester-settings/${id}`);
  },
};