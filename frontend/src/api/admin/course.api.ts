// frontend/src/api/admin/course.api.ts

import client from "@/api/client";
import type { Course } from "@/types/admin/course.types";

export interface CreateCourseRequest {
  programId: string;  // camelCase — matches backend CreateCourseDto exactly
  name: string;
  code?: string;
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
}

export interface GetCoursesQuery {
  programId?: string;  // camelCase — matches backend CourseQueryDto exactly
}

export const courseApi = {
  getAll: async (query?: GetCoursesQuery): Promise<Course[]> => {
    const res = await client.get<Course[]>("/courses", { params: query });
    return res.data;
  },

  getOne: async (id: string): Promise<Course> => {
    const res = await client.get<Course>(`/courses/${id}`);
    return res.data;
  },

  create: async (data: CreateCourseRequest): Promise<Course> => {
    const res = await client.post<Course>("/courses", data);
    return res.data;
  },

  update: async (id: string, data: UpdateCourseRequest): Promise<Course> => {
    const res = await client.patch<Course>(`/courses/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/courses/${id}`);
  },
};