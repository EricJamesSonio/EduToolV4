import client from "@/api/client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SubjectCompletionOverride {
  id: string;
  student_id: string;
  subject_id: string;
  status: "completed" | "pending";
  reason: string | null;
  created_at: string;
  updated_at: string;
  subject: {
    id: string;
    name: string;
    year_level: string | null;
    term_label: string | null;
  };
}

export interface SubjectCatalogItem {
  id: string;
  name: string;
  year_level: string | null;
  term_label: string | null;
}

export const subjectCompletionApi = {
  list: async (studentId: string): Promise<SubjectCompletionOverride[]> => {
    const res = await client.get<ApiResponse<SubjectCompletionOverride[]>>(
      `/students/${studentId}/subject-completions`,
    );
    return res.data.data ?? [];
  },
  catalog: async (studentId: string, search?: string): Promise<SubjectCatalogItem[]> => {
    const res = await client.get<ApiResponse<SubjectCatalogItem[]>>(
      `/students/${studentId}/subject-completions/catalog`,
      { params: search ? { search } : {} },
    );
    return res.data.data ?? [];
  },
  markCompleted: async (studentId: string, subjectId: string, reason?: string): Promise<SubjectCompletionOverride> => {
    const res = await client.post<ApiResponse<SubjectCompletionOverride>>(
      `/students/${studentId}/subject-completions`,
      { subjectId, ...(reason ? { reason } : {}) },
    );
    return res.data.data;
  },
  updateStatus: async (
    studentId: string,
    overrideId: string,
    status: "completed" | "pending",
    reason?: string,
  ): Promise<SubjectCompletionOverride> => {
    const res = await client.patch<ApiResponse<SubjectCompletionOverride>>(
      `/students/${studentId}/subject-completions/${overrideId}`,
      { status, ...(reason ? { reason } : {}) },
    );
    return res.data.data;
  },
  abort: async (studentId: string, overrideId: string, removeDependents = false): Promise<{ deleted: boolean }> => {
    const res = await client.delete<ApiResponse<{ deleted: boolean }>>(
      `/students/${studentId}/subject-completions/${overrideId}`,
      { params: removeDependents ? { removeDependents: "true" } : {} },
    );
    return res.data.data;
  },
};
