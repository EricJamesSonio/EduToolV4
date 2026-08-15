// ===== File: frontend\src\api\admin\subject.api.ts =====

import client from "@/api/client";
import type {
  Subject,
  SubjectSharing,
  SubjectType,
} from "@/types/admin/subject.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { AxiosResponse } from "axios";

// ==============================
// REQUEST TYPES
// ==============================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SELECT_LIMIT = 5000;

export interface CreateSubjectRequest {
  name: string;
  subjectType: SubjectType;   // ✅ REQUIRED
  programId: string;          // ✅ REQUIRED

  levelId?: string;           // optional (minor doesn't need it)
  courseId?: string;
  strandId?: string;
  yearLevel?: string;
  termLabel?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  subjectType?: SubjectType;
  programId?: string;         // ✅ allows reassigning to another department
  levelId?: string | null;
  courseId?: string | null;
  strandId?: string | null;
  yearLevel?: string;
  termLabel?: string;
}

export interface GetSubjectsQuery {
  schoolYearId?: string;
  programId?:    string;   // ← was missing
  levelId?:      string;
  search?:       string;
  courseId?:     string;
  strandId?:     string;
  subjectType?:  SubjectType;
  page?:         number;
  limit?:        number;
}

export interface ShareSubjectRequest {
  courseId?: string;
  strandId?: string;
  levelId?: string;
}

// ==============================
// RESPONSE TYPES
// ==============================

interface SubjectResponse {
  id: string;
  orgId: string;
  title: string;
  subjectType: SubjectType;

  programId: string | null;
  programName?: string | null;
  programType?: string | null;
  realProgramId?: string | null;

  levelId: string | null;
  levelName?: string | null;

  courseId: string | null;
  strandId?: string | null;

  educatorId?: string | null;
  educatorName?: string | null;

  lockStatus: "locked" | "unlocked";

  yearLevel?: string | null;
  termLabel?: string | null;

  prerequisites?: unknown[];
  prereqFor?: unknown[];

  sharings?: SubjectSharing[];

  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==============================
// MAPPER
// ==============================

function mapSubject(s: SubjectResponse): Subject {
  return {
    id: s.id,
    orgId: s.orgId,
    title: s.title,

    subjectType: s.subjectType ?? "major",

    programId: s.programId ?? "",
    programName: s.programName ?? "",
    programType: s.programType ?? null,
    realProgramId: s.realProgramId ?? null,

    levelId: s.levelId ?? null,
    levelName: s.levelName ?? null,

    courseId: s.courseId,
    strandId: s.strandId ?? null,

    educatorId: s.educatorId ?? null,
    educatorName: s.educatorName ?? null,

    lockStatus: s.lockStatus,

    yearLevel: s.yearLevel ?? null,
    termLabel: s.termLabel ?? null,

    prerequisites: s.prerequisites ?? [],
    prereqFor: s.prereqFor ?? [],

    sharings: s.sharings ?? [],

    createdAt: s.createdAt ?? "",
    updatedAt: s.updatedAt ?? "",
  };
}
// ==============================
// API
// ==============================

export const subjectApi = {
  getPage: async (params?: GetSubjectsQuery): Promise<PaginatedResponse<Subject>> => {
    const query = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== "",
          ),
        )
      : undefined;

    const res: AxiosResponse<ApiResponse<PaginatedResponse<SubjectResponse>>> =
      await client.get("/subjects", { params: query });

    return {
      data: res.data.data.data.map(mapSubject),
      meta: res.data.data.meta,
    };
  },

  getAll: async (params?: GetSubjectsQuery): Promise<Subject[]> => {
    const result = await subjectApi.getPage({
      ...params,
      limit: params?.limit ?? MAX_SELECT_LIMIT,
    });
    return result.data;
  },

  getOne: async (id: string): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> =
      await client.get(`/subjects/${id}`);

    return mapSubject(res.data.data);
  },

  create: async (data: CreateSubjectRequest): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> =
      await client.post("/subjects", data);

    return mapSubject(res.data.data);
  },

  update: async (
    id: string,
    data: UpdateSubjectRequest,
  ): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> =
      await client.patch(`/subjects/${id}`, data);

    return mapSubject(res.data.data);
  },

  lock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> =
      await client.patch(`/subjects/${id}/lock`);

    return res.data;
  },

  unlock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> =
      await client.patch(`/subjects/${id}/unlock`);

    return res.data;
  },

  share: async (
    id: string,
    data: ShareSubjectRequest,
  ): Promise<SubjectSharing> => {
    const res: AxiosResponse<ApiResponse<SubjectSharing>> =
      await client.post(`/subjects/${id}/share`, data);

    return res.data.data;
  },

  unshare: async (
    id: string,
    sharingId: string,
  ): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> =
      await client.delete(`/subjects/${id}/share/${sharingId}`);

    return res.data;
  },

  getSharings: async (id: string): Promise<SubjectSharing[]> => {
    const res: AxiosResponse<ApiResponse<SubjectSharing[]>> =
      await client.get(`/subjects/${id}/sharings`);

    return res.data.data;
  },
};