import client from "@/api/client";
import type { Subject } from "@/types/admin/subject.types";

export interface CreateSubjectRequest {
  name: string;
  levelId: string;
  educatorId?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  levelId?: string;
  educatorId?: string;
}

export interface GetSubjectsQuery {
  levelId?: string;
  educatorId?: string;
  search?: string;
}

export const subjectApi = {
  getAll: async (query?: GetSubjectsQuery): Promise<Subject[]> => {
    const res = await client.get<Subject[]>("/subjects", { params: query });
    return res.data;
  },
  getOne: async (id: string): Promise<Subject> => {
    const res = await client.get<Subject>(`/subjects/${id}`);
    return res.data;
  },
  create: async (data: CreateSubjectRequest): Promise<Subject> => {
    const res = await client.post<Subject>("/subjects", data);
    return res.data;
  },
  update: async (id: string, data: UpdateSubjectRequest): Promise<Subject> => {
    const res = await client.patch<Subject>(`/subjects/${id}`, data);
    return res.data;
  },
  lock: async (id: string): Promise<{ success: true }> => {
    const res = await client.patch<{ success: true }>(`/subjects/${id}/lock`);
    return res.data;
  },
  unlock: async (id: string): Promise<{ success: true }> => {
    const res = await client.patch<{ success: true }>(`/subjects/${id}/unlock`);
    return res.data;
  },
};