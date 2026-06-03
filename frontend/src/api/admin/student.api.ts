import client from "@/api/client";
import type { Student, StudentStatus, BulkImportResult } from "@/types/admin/student.types";

export interface CreateStudentRequest {
  fullName:  string;
  emailName: string;
  studentId: string;
}

export interface CreateStudentResponse {
  id:            string;
  orgId:         string;
  fullName:      string;
  email:         string;
  studentId:     string;
  status:        StudentStatus;
  createdAt:     string;
  plainPassword: string;
}

export interface UpdateStudentRequest {
  fullName?:     string;
  email?:        string;
  profileImage?: string;
}

export interface UpdateStudentStatusRequest {
  status:  StudentStatus;
  reason?: string;
}

export interface GetStudentsQuery {
  search?:       string;
  status?:       StudentStatus;
  // Hierarchy filters — each narrows the result set
  schoolYearId?: string;
  programId?:    string;
  courseId?:     string;
  strandId?:     string;
  levelId?:      string;
  sectionId?:    string;
}

export interface StudentEnrollment {
  id:       string;
  class_id: string;
  status:   string;
  class?: {
    id:         string;
    subject_id: string;
    subject?:   { id: string; name: string };
  };
}

export interface AddEnrollmentResponse {
  id?:        string;
  overflow?:  boolean;
  message?:   string;
  classId?:   string;
  studentId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const studentApi = {
  getAll: async (query?: GetStudentsQuery): Promise<Student[]> => {
    const params = query
      ? Object.fromEntries(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;
    const res = await client.get<ApiResponse<Student[]>>("/students", { params });
    return res.data.data;
  },

  getOne: async (id: string): Promise<Student> => {
    const res = await client.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },

  create: async (data: CreateStudentRequest): Promise<CreateStudentResponse> => {
    const res = await client.post<ApiResponse<CreateStudentResponse>>("/students", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateStudentRequest): Promise<Student> => {
    const res = await client.patch<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (
    id:   string,
    data: UpdateStudentStatusRequest,
  ): Promise<Student> => {
    const res = await client.patch<ApiResponse<Student>>(
      `/students/${id}/status`,
      data,
    );
    return res.data.data;
  },

  resetPassword: async (id: string): Promise<{ plainPassword: string }> => {
    const res = await client.post<ApiResponse<{ plainPassword: string }>>(
      `/students/${id}/reset-password`,
    );
    return res.data.data;
  },

  bulkImport: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<ApiResponse<BulkImportResult>>(
      "/students/import",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  downloadTemplate:    (): string => `${client.defaults.baseURL}/students/import-template`,
  downloadCredentials: (): string => `${client.defaults.baseURL}/students/credentials-csv`,

  getEnrollments: async (studentId: string): Promise<StudentEnrollment[]> => {
    const res = await client.get<ApiResponse<StudentEnrollment[]>>(
      `/students/${studentId}/enrollments`,
    );
    return res.data.data;
  },

  addEnrollment: async (
    studentId: string,
    classId:   string,
  ): Promise<AddEnrollmentResponse> => {
    const res = await client.post<ApiResponse<AddEnrollmentResponse>>(
      `/students/${studentId}/enrollments`,
      { classId },
    );
    return res.data.data;
  },

  removeEnrollment: async (
    studentId:    string,
    enrollmentId: string,
  ): Promise<void> => {
    await client.delete(`/students/${studentId}/enrollments/${enrollmentId}`);
  },
};