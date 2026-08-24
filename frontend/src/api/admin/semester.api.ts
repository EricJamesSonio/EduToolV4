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

// API wraps responses in { success, data }
interface ApiListResponse<T> {
  success: boolean;
  data: T;
}

const mapSemester = (data: SemesterResponse): Semester => ({
  id: data.id,
  schoolYearId: data.school_year_id,
  name: data.name,
  startDate: data.start_date,
  endDate: data.end_date,
  terms:
    data.terms?.map((t) => ({
      id: t.id,
      name: t.name,
      orderIndex: t.order_index,
      startDate: t.start_date,
      endDate: t.end_date,
    })) ?? [],
});

export const semesterApi = {
  getAll: async (schoolYearId?: string): Promise<Semester[]> => {
    const res = await client.get<ApiListResponse<SemesterResponse[]>>("/semester-settings", {
      params: schoolYearId ? { schoolYearId } : undefined,
    });
    // Response shape: { success: true, data: [...] }
    const list = res.data.data ?? res.data;
    return (Array.isArray(list) ? list : []).map(mapSemester);
  },

  getByProgram: async (programId: string, schoolYearId: string): Promise<Semester[]> => {
    const res = await client.get<ApiListResponse<SemesterResponse[]>>(`/programs/${programId}/semesters`, {
      params: { schoolYearId },
    });
    const list = res.data.data ?? res.data;
    return Array.isArray(list) ? list.map(mapSemester) : [];
  },

  create: async (data: CreateSemesterRequest): Promise<Semester> => {
    const res = await client.post<ApiListResponse<SemesterResponse>>("/semester-settings", data);
    return mapSemester(res.data.data);  // ← unwrap
  },

  update: async (id: string, data: UpdateSemesterRequest): Promise<Semester> => {
    const res = await client.patch<ApiListResponse<SemesterResponse>>(`/semester-settings/${id}`, data);
    return mapSemester(res.data.data);  // ← unwrap
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/semester-settings/${id}`);
  },
};