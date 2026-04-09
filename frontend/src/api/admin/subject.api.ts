import client from "@/api/client";
import type { Subject, SubjectSharing, SubjectType } from "@/types/admin/subject.types";
import type { AxiosResponse } from "axios";

// ---------------------------------------------------------------------------
// Request shapes
// ---------------------------------------------------------------------------

export interface CreateSubjectRequest {
  name: string;
  levelId?: string;
  subjectType?: SubjectType;
  programId?: string;
  courseId?: string;
  strandId?: string;
  yearLevel?: string;
  termLabel?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  levelId?: string;
  courseId?: string;
  strandId?: string;
  yearLevel?: string;
  termLabel?: string;
}

export interface GetSubjectsQuery {
  schoolYearId?: string;
  levelId?: string;
  educatorId?: string; // still allowed for filtering
  search?: string;
  courseId?: string;
  strandId?: string;
  subjectType?: SubjectType;
}

export interface ShareSubjectRequest {
  courseId?: string;
  strandId?: string;
  levelId?: string;
}

// ---------------------------------------------------------------------------
// Raw backend response shape
// ---------------------------------------------------------------------------

interface SubjectResponse {
  id: string;
  orgId: string;

  title: string;
  subjectType: SubjectType;

  programId: string | null;
  programName?: string | null;

  levelName?: string | null;
  levelId: string | null;

  realProgramId?: string | null;

  courseId: string | null;
  strandId?: string | null;

  // ❌ REMOVED educator fields

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

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapSubject(s: SubjectResponse): Subject {
  return {
    id:            s.id,
    orgId:         s.orgId,

    title:         s.title,
    subjectType:   s.subjectType ?? "major",

    programId:     s.programId   ?? "",
    programName:   s.programName ?? "",

    realProgramId: s.realProgramId ?? null,

    levelId:       s.levelId   ?? null,
    levelName:     s.levelName ?? null,

    courseId:      s.courseId,
    strandId:      s.strandId ?? null,

    // ❌ REMOVED educator mapping

    lockStatus:    s.lockStatus,

    yearLevel:     s.yearLevel ?? null,
    termLabel:     s.termLabel ?? null,

    prerequisites: s.prerequisites ?? [],
    prereqFor:     s.prereqFor ?? [],

    sharings:      s.sharings ?? [],

    createdAt:     s.createdAt ?? "",
    updatedAt:     s.updatedAt ?? "",
  };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const subjectApi = {
  getAll: async (params?: GetSubjectsQuery): Promise<Subject[]> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse[]>> = await client.get(
      "/subjects",
      { params },
    );
    return res.data.data.map(mapSubject);
  },

  getOne: async (id: string): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> = await client.get(
      `/subjects/${id}`,
    );
    return mapSubject(res.data.data);
  },

  create: async (data: CreateSubjectRequest): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> = await client.post(
      "/subjects",
      data,
    );
    return mapSubject(res.data.data);
  },

  update: async (id: string, data: UpdateSubjectRequest): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> = await client.patch(
      `/subjects/${id}`,
      data,
    );
    return mapSubject(res.data.data);
  },

  lock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> = await client.patch(
      `/subjects/${id}/lock`,
    );
    return res.data;
  },

  unlock: async (id: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> = await client.patch(
      `/subjects/${id}/unlock`,
    );
    return res.data;
  },

  // Sharing (minor subjects only)
  share: async (id: string, data: ShareSubjectRequest): Promise<SubjectSharing> => {
    const res: AxiosResponse<ApiResponse<SubjectSharing>> = await client.post(
      `/subjects/${id}/share`,
      data,
    );
    return res.data.data;
  },

  unshare: async (id: string, sharingId: string): Promise<{ success: true }> => {
    const res: AxiosResponse<{ success: true }> = await client.delete(
      `/subjects/${id}/share/${sharingId}`,
    );
    return res.data;
  },

  getSharings: async (id: string): Promise<SubjectSharing[]> => {
    const res: AxiosResponse<ApiResponse<SubjectSharing[]>> = await client.get(
      `/subjects/${id}/sharings`,
    );
    return res.data.data;
  },
};