import client from "@/api/client";
import type { Class } from "@/types/admin/class.types";

export interface ScheduleSlot {
  weekday:   number;
  startTime: string;
  endTime:   string;
}

export interface CreateClassRequest {
  subjectId:    string;
  educatorId:   string;
  sectionId?:   string;
  schoolYearId: string;
  semesterId:   string;
  capacity:     number;
  schedules:    ScheduleSlot[];
}

export interface UpdateClassRequest {
  educatorId?: string;
  sectionId?:  string;
  capacity?:   number;
  schedules?:  ScheduleSlot[];
}

export interface GetClassesQuery {
  schoolYearId?: string;
  semesterId?:   string;
  educatorId?:   string;
  subjectId?:    string;
  sectionId?:    string;
}

export interface EnrollmentResponse {
  id:         string;
  class_id:   string;
  student_id: string;
  status:     "active" | "pending" | "removed";
}

export interface EnrollOverflowResponse {
  overflow:  true;
  message:   string;
  classId:   string;
  studentId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

function unwrap<T>(res: { data: ApiResponse<T> | T }): T {
  const d = res.data as ApiResponse<T>;
  return d?.data !== undefined ? d.data : (res.data as T);
}

function unwrapList<T>(res: { data: ApiResponse<T[]> | T[] }): T[] {
  if (Array.isArray(res.data)) return res.data;
  const d = res.data as ApiResponse<T[]>;
  return Array.isArray(d?.data) ? d.data : [];
}

export const classApi = {
  getAll: async (query?: GetClassesQuery): Promise<Class[]> => {
    const res = await client.get<ApiResponse<Class[]> | Class[]>("/classes", { params: query });
    return unwrapList<Class>(res);
  },

  getOne: async (id: string): Promise<Class> => {
    const res = await client.get<ApiResponse<Class> | Class>(`/classes/${id}`);
    return unwrap<Class>(res);
  },

  create: async (data: CreateClassRequest): Promise<Class> => {
    const res = await client.post<ApiResponse<Class> | Class>("/classes", data);
    return unwrap<Class>(res);
  },

  update: async (id: string, data: UpdateClassRequest): Promise<Class> => {
    const res = await client.patch<ApiResponse<Class> | Class>(`/classes/${id}`, data);
    return unwrap<Class>(res);
  },

  archive: async (id: string): Promise<void> => {
    await client.delete(`/classes/${id}`);
  },

  getEnrollments: async (classId: string): Promise<EnrollmentResponse[]> => {
    const res = await client.get<ApiResponse<EnrollmentResponse[]> | EnrollmentResponse[]>(
      `/classes/${classId}/enrollments`
    );
    return unwrapList<EnrollmentResponse>(res);
  },

  enroll: async (
    classId: string,
    studentId: string
  ): Promise<EnrollmentResponse | EnrollOverflowResponse> => {
    const res = await client.post<ApiResponse<EnrollmentResponse | EnrollOverflowResponse> | EnrollmentResponse | EnrollOverflowResponse>(
      `/classes/${classId}/enroll`,
      { studentId }
    );
    return unwrap<EnrollmentResponse | EnrollOverflowResponse>(res);
  },

  updateEnrollment: async (
    classId: string,
    enrollmentId: string,
    status: "active" | "pending" | "removed"
  ): Promise<EnrollmentResponse> => {
    const res = await client.patch<ApiResponse<EnrollmentResponse> | EnrollmentResponse>(
      `/classes/${classId}/enrollments/${enrollmentId}`,
      { status }
    );
    return unwrap<EnrollmentResponse>(res);
  },

  removeEnrollment: async (
    classId: string,
    enrollmentId: string
  ): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(
      `/classes/${classId}/enrollments/${enrollmentId}`
    );
    return res.data;
  },
};