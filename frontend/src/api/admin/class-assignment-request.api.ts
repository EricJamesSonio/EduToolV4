import client from "@/api/client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface CreateRequestPayload {
  studentSchoolYearId: string;
  programEnrollmentId?: string;
  origin: "student_request" | "admin_flag";
  studentRequestedSubjectIds?: string[];
  adminFinalizedSubjectIds?: string[];
}

export const classAssignmentRequestApi = {
  create: async (data: CreateRequestPayload): Promise<unknown> => {
    const res = await client.post<ApiResponse<unknown>>("/class-assignment-requests", data);
    return res.data.data;
  },

  list: async (params?: { studentId?: string; schoolYearId?: string; status?: string }): Promise<{ data: unknown[]; total: number }> => {
    const res = await client.get<ApiResponse<{ data: unknown[]; total: number; page: number; limit: number }>>(
      "/class-assignment-requests",
      { params },
    );
    return res.data.data as { data: unknown[]; total: number };
  },

  finalize: async (id: string, adminFinalizedSubjectIds: string[]): Promise<unknown> => {
    const res = await client.patch<ApiResponse<unknown>>(`/class-assignment-requests/${id}/finalize`, {
      adminFinalizedSubjectIds,
    });
    return res.data.data;
  },

  reopen: async (id: string, reason?: string): Promise<unknown> => {
    const res = await client.patch<ApiResponse<unknown>>(`/class-assignment-requests/${id}/reopen`, { reason });
    return res.data.data;
  },
};
