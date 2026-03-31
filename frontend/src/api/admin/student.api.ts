// frontend/src/api/admin/student.api.ts

import client from "@/api/client";
import type { Student, StudentStatus, BulkImportResult } from "@/types/admin/student.types";

export interface CreateStudentRequest {
  fullName: string;
  email: string;
  studentId: string;      // was: studentCode — matches backend CreateStudentDto
  levelId: string;
  sectionId?: string;
}

export interface CreateStudentResponse {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  studentId: string;
  levelId: string;
  sectionId: string | null;
  status: StudentStatus;
  createdAt: string;
  plainPassword: string;  // shown once — never store or log
}

export interface UpdateStudentRequest {
  fullName?: string;
  email?: string;
  levelId?: string;
  sectionId?: string;
}

export interface UpdateStudentStatusRequest {
  status: StudentStatus;
  reason?: string;
}

export interface GetStudentsQuery {
  search?: string;
  status?: StudentStatus;
  levelId?: string;
  sectionId?: string;
}

export interface StudentEnrollment {
  id: string;
  classId: string;
  status: string;
}

export interface AddEnrollmentResponse {
  id?: string;
  overflow?: boolean;
  message?: string;
  classId?: string;
  studentId?: string;
}

export const studentApi = {
  getAll: async (query?: GetStudentsQuery): Promise<Student[]> => {
    const res = await client.get<Student[]>("/students", { params: query });
    return res.data;
  },

  getOne: async (id: string): Promise<Student> => {
    const res = await client.get<Student>(`/students/${id}`);
    return res.data;
  },

  create: async (data: CreateStudentRequest): Promise<CreateStudentResponse> => {
    const res = await client.post<CreateStudentResponse>("/students", data);
    return res.data;
  },

  update: async (id: string, data: UpdateStudentRequest): Promise<Student> => {
    const res = await client.patch<Student>(`/students/${id}`, data);
    return res.data;
  },

  updateStatus: async (
    id: string,
    data: UpdateStudentStatusRequest,
  ): Promise<Student> => {
    const res = await client.patch<Student>(`/students/${id}/status`, data);
    return res.data;
  },

  resetPassword: async (id: string): Promise<{ plainPassword: string }> => {
    const res = await client.post<{ plainPassword: string }>(
      `/students/${id}/reset-password`,
    );
    return res.data;
  },

  bulkImport: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<BulkImportResult>("/students/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  downloadTemplate: (): string =>
    `${client.defaults.baseURL}/students/import-template`,

  downloadCredentials: (): string =>
    `${client.defaults.baseURL}/students/credentials-csv`,

  getEnrollments: async (studentId: string): Promise<StudentEnrollment[]> => {
    const res = await client.get<StudentEnrollment[]>(
      `/students/${studentId}/enrollments`,
    );
    return res.data;
  },

  addEnrollment: async (
    studentId: string,
    classId: string,
  ): Promise<AddEnrollmentResponse> => {
    const res = await client.post<AddEnrollmentResponse>(
      `/students/${studentId}/enrollments`,
      { classId },
    );
    return res.data;
  },

  removeEnrollment: async (
    studentId: string,
    enrollmentId: string,
  ): Promise<void> => {
    await client.delete(`/students/${studentId}/enrollments/${enrollmentId}`);
  },
};