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

interface SubjectResponse {
  id: string;
  orgId: string;
  name: string;
  levelId: string;
  programName?: string;
  courseId: string | null;
  educatorId?: string | null;
  educatorName?: string | null;
  isLocked: boolean;
  yearLevel?: string | null;
  termLabel?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const subjectApi = {
getAll: async (params?: GetSubjectsQuery): Promise<Subject[]> => {
  const res = await client.get<SubjectResponse[]>("/subjects", { params });

  return res.data.map((s: SubjectResponse) => ({
    id: s.id,
    orgId: s.orgId,
    title: s.name,
    gradeLevel: s.yearLevel ?? "",
    programId: s.levelId,
    programName: s.programName ?? "",
    courseId: s.courseId,
    courseName: null,
    educatorId: s.educatorId ?? null,
    educatorName: s.educatorName ?? null,
    gradingSystemId: null,
    gradingSystemName: null,
    lockStatus: s.isLocked ? "locked" : "unlocked",
    createdAt: s.createdAt ?? "",
    updatedAt: s.updatedAt ?? "",
  }));
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