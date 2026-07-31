import client from "@/api/client";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
  EnrollStudentRequest,
  BulkEnrollStudentsRequest,
  BulkEnrollResult,
  UpdateSchoolYearEnrollmentRequest,
  EnrollStudentProgramRequest,
  UpdateProgramEnrollmentRequest,
} from "@/types/admin/student-enrollment.types";

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

export const studentEnrollmentApi = {
  // ── School-year level ───────────────────────────────────────────────────────

  getBySchoolYear: async (
    schoolYearId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<StudentSchoolYearEnrollment>> => {
    const res = await client.get<ApiResponse<PaginatedResponse<StudentSchoolYearEnrollment>>>(
      `/school-years/${schoolYearId}/enrollments`,
      { params: { page, limit } },
    );
    return res.data.data;
  },

  enroll: async (
    schoolYearId: string,
    data: EnrollStudentRequest,
  ): Promise<StudentSchoolYearEnrollment> => {
    const res = await client.post<ApiResponse<StudentSchoolYearEnrollment>>(
      `/school-years/${schoolYearId}/enrollments`,
      data,
    );
    return res.data.data;
  },

  bulkEnroll: async (
    schoolYearId: string,
    data: BulkEnrollStudentsRequest,
  ): Promise<BulkEnrollResult> => {
    const res = await client.post<ApiResponse<BulkEnrollResult>>(
      `/school-years/${schoolYearId}/enrollments/bulk`,
      data,
    );
    return res.data.data;
  },

  updateEnrollment: async (
    schoolYearId:  string,
    enrollmentId:  string,
    data: UpdateSchoolYearEnrollmentRequest,
  ): Promise<StudentSchoolYearEnrollment> => {
    const res = await client.patch<ApiResponse<StudentSchoolYearEnrollment>>(
      `/school-years/${schoolYearId}/enrollments/${enrollmentId}`,
      data,
    );
    return res.data.data;
  },

  unenroll: async (
    schoolYearId: string,
    enrollmentId: string,
  ): Promise<void> => {
    await client.delete(
      `/school-years/${schoolYearId}/enrollments/${enrollmentId}`,
    );
  },

  // ── Program level ───────────────────────────────────────────────────────────

  enrollInProgram: async (
    schoolYearId: string,
    studentId:    string,
    data: EnrollStudentProgramRequest,
  ): Promise<ProgramEnrollmentSnapshot> => {
    const res = await client.post<ApiResponse<ProgramEnrollmentSnapshot>>(
      `/school-years/${schoolYearId}/enrollments/students/${studentId}/programs`,
      data,
    );
    return res.data.data;
  },

  updateProgramEnrollment: async (
    schoolYearId:        string,
    programEnrollmentId: string,
    data: UpdateProgramEnrollmentRequest,
  ): Promise<ProgramEnrollmentSnapshot> => {
    const res = await client.patch<ApiResponse<ProgramEnrollmentSnapshot>>(
      `/school-years/${schoolYearId}/enrollments/programs/${programEnrollmentId}`,
      data,
    );
    return res.data.data;
  },

  removeProgramEnrollment: async (
    schoolYearId:        string,
    programEnrollmentId: string,
  ): Promise<void> => {
    await client.delete(
      `/school-years/${schoolYearId}/enrollments/programs/${programEnrollmentId}`,
    );
  },
};