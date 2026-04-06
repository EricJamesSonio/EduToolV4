import client from "@/api/client";
import type { Course } from "@/types/admin/course.types";

export interface CreateCourseRequest {
  schoolYearId: string;
  programId:    string;
  name:         string;
  code?:        string;
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
}

export interface GetCoursesQuery {
  schoolYearId: string;
  programId?:   string;
}

export const courseApi = {
  getAll: async (query: GetCoursesQuery): Promise<Course[]> => {
    const res = await client.get<{ success: boolean; data: Course[] }>("/courses", {
      params: query,
    });
    return res.data.data;
  },

  getOne: async (id: string): Promise<Course> => {
    const res = await client.get<{ success: boolean; data: Course }>(`/courses/${id}`);
    return res.data.data;
  },

  create: async (data: CreateCourseRequest): Promise<Course> => {
    const res = await client.post<{ success: boolean; data: Course }>("/courses", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateCourseRequest): Promise<Course> => {
    const res = await client.patch<{ success: boolean; data: Course }>(`/courses/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/courses/${id}`);
  },
};