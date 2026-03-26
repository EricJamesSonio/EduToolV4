import client from "@/api/client";
import type { Class, ClassSchedule } from "@/types/admin/class.types";

export interface ScheduleSlot {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface CreateClassRequest {
  subjectId: string;
  educatorId: string;
  sectionId?: string;
  schoolYearId: string;
  semesterId: string;
  capacity: number;
  schedules: ScheduleSlot[];
}

export interface UpdateClassRequest {
  educatorId?: string;
  sectionId?: string;
  capacity?: number;
  schedules?: ScheduleSlot[];
}

export interface GetClassesQuery {
  schoolYearId?: string;
  semesterId?: string;
  educatorId?: string;
  subjectId?: string;
  sectionId?: string;
}

export interface EnrollmentResponse {
  id: string;
  class_id: string;
  student_id: string;
  status: "active" | "pending" | "removed";
}

export interface EnrollOverflowResponse {
  overflow: true;
  message: string;
  classId: string;
  studentId: string;
}

export const classApi = {
  getAll: async (query?: GetClassesQuery): Promise<Class[]> => {
    const res = await client.get<Class[]>("/classes", { params: query });
    return res.data;
  },

  getOne: async (id: string): Promise<Class> => {
    const res = await client.get<Class>(`/classes/${id}`);
    return res.data;
  },

  create: async (data: CreateClassRequest): Promise<Class> => {
    const res = await client.post<Class>("/classes", data);
    return res.data;
  },

  update: async (id: string, data: UpdateClassRequest): Promise<Class> => {
    const res = await client.patch<Class>(`/classes/${id}`, data);
    return res.data;
  },

  archive: async (id: string): Promise<void> => {
    await client.delete(`/classes/${id}`);
  },

  getEnrollments: async (classId: string): Promise<EnrollmentResponse[]> => {
    const res = await client.get<EnrollmentResponse[]>(
      `/classes/${classId}/enrollments`
    );
    return res.data;
  },

  enroll: async (
    classId: string,
    studentId: string
  ): Promise<EnrollmentResponse | EnrollOverflowResponse> => {
    const res = await client.post<EnrollmentResponse | EnrollOverflowResponse>(
      `/classes/${classId}/enroll`,
      { studentId }
    );
    return res.data;
  },

  updateEnrollment: async (
    classId: string,
    enrollmentId: string,
    status: "active" | "pending" | "removed"
  ): Promise<EnrollmentResponse> => {
    const res = await client.patch<EnrollmentResponse>(
      `/classes/${classId}/enrollments/${enrollmentId}`,
      { status }
    );
    return res.data;
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