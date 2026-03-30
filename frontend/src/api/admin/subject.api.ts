import client from "@/api/client";
import type { Subject } from "@/types/admin/subject.types";
import type { AxiosResponse } from "axios";

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

// Backend Subject DTO
interface SubjectResponse {
  id: string;
  orgId: string;
  title: string;
  programId: string;
  programName?: string;
  courseId: string | null;
  educatorId?: string | null;
  educatorName?: string | null;
  lockStatus: "locked" | "unlocked";
  yearLevel?: string | null;
  termLabel?: string | null;
  strandId?: string | null;
  prerequisites?: unknown[];
  prereqFor?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

// Wrapper for getAll response
interface GetSubjectsResponse {
  success: boolean;
  data: SubjectResponse[];
}

export const subjectApi = {
  getAll: async (params?: GetSubjectsQuery): Promise<Subject[]> => {
    const res: AxiosResponse<GetSubjectsResponse> = await client.get("/subjects", { params });

    return res.data.data.map((s) => ({
      id: s.id,
      orgId: s.orgId,
      title: s.title,
      gradeLevel: s.yearLevel ?? "",
      programId: s.programId,
      programName: s.programName ?? "",
      courseId: s.courseId,
      courseName: null,
      educatorId: s.educatorId ?? null,
      educatorName: s.educatorName ?? null,
      gradingSystemId: null,
      gradingSystemName: null,
      lockStatus: s.lockStatus,
      createdAt: s.createdAt ?? "",
      updatedAt: s.updatedAt ?? "",
    }));
  },

  getOne: async (id: string): Promise<Subject> => {
    const res: AxiosResponse<Subject> = await client.get(`/subjects/${id}`);
    return res.data;
  },

  create: async (data: CreateSubjectRequest): Promise<Subject> => {
    const res: AxiosResponse<Subject> = await client.post("/subjects", data);
    return res.data;
  },

  update: async (id: string, data: UpdateSubjectRequest): Promise<Subject> => {
    const res: AxiosResponse<Subject> = await client.patch(`/subjects/${id}`, data);
    return res.data;
  },

  lock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> = await client.patch(`/subjects/${id}/lock`);
    return res.data;
  },

  unlock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> = await client.patch(`/subjects/${id}/unlock`);
    return res.data;
  },
};