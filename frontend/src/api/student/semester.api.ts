// frontend/src/api/student/semester.api.ts
import apiClient from "@/api/client";

export interface StudentSemesterItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export const studentSemesterApi = {
  getAll: async (): Promise<StudentSemesterItem[]> => {
    const { data } = await apiClient.get("/student/semesters");
    // Backend ResponseInterceptor wraps responses: { success, data: [...] }
    return Array.isArray(data) ? data : (data?.data ?? []);
  },
};