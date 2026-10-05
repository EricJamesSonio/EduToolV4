// ===== File: frontend\src\api\admin\subject.api.ts =====

import client from "@/api/client";
import type {
  Subject,
  SubjectSharing,
  SubjectType,
} from "@/types/admin/subject.types";
import type { DeletionCheck } from "@/types/admin/deletion.types";
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
  /** Optional. Omit or null to fall back to the program-type default. */
  sessionsPerWeek?: number | null;
  sessionMinutes?: number | null;
  /**
   * Per-session lengths. Omit, null, or an empty array to stay uniform
   * (every session uses `sessionMinutes`). Non-empty must have exactly one
   * entry per weekly session.
   */
  sessionDurations?: number[] | null;
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
  /** null clears back to the program-type default. */
  sessionsPerWeek?: number | null;
  sessionMinutes?: number | null;
  /** null / [] clears back to uniform. */
  sessionDurations?: number[] | null;
}

export interface GetSubjectsQuery {
  schoolYearId?: string;
  programId?:    string;   // ← was missing
  levelId?:      string;
  search?:       string;
  courseId?:     string;
  strandId?:     string;
  subjectType?:  SubjectType;
  /** When true, lists archived subjects instead of active ones. */
  archived?:     boolean;
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
  courseName?: string | null;
  strandId?: string | null;
  strandName?: string | null;

  educatorId?: string | null;
  educatorName?: string | null;

  lockStatus: "locked" | "unlocked";

  deletedAt?: string | null;
  classCount?: number | null;

  yearLevel?: string | null;
  termLabel?: string | null;

  sessionsPerWeek?: number | null;
  sessionMinutes?: number | null;
  sessionDurations?: number[] | null;
  effectiveSessionsPerWeek?: number;
  effectiveSessionMinutes?: number;
  effectiveSessionDurations?: number[];
  sessionRequirementSource?: "explicit" | "default";

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

/**
 * Guarantees exactly one length per weekly session.
 *
 * The backend already sends a correctly-sized list; this only covers an older
 * or partial response, where a short array would make a per-position consumer
 * read `undefined` as a session length.
 */
function resolveEffectiveDurations(s: SubjectResponse): number[] {
  const count = s.effectiveSessionsPerWeek ?? 5;
  const base = s.effectiveSessionMinutes ?? 60;
  const list = s.effectiveSessionDurations;
  if (list && list.length === count) return [...list];
  return Array.from({ length: count }, () => base);
}

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
    courseName: s.courseName ?? null,
    strandId: s.strandId ?? null,
    strandName: s.strandName ?? null,

    educatorId: s.educatorId ?? null,
    educatorName: s.educatorName ?? null,

    lockStatus: s.lockStatus,

    deletedAt: s.deletedAt ?? null,
    classCount: s.classCount ?? null,

    yearLevel: s.yearLevel ?? null,
    termLabel: s.termLabel ?? null,

    sessionsPerWeek: s.sessionsPerWeek ?? null,
    sessionMinutes: s.sessionMinutes ?? null,
    sessionDurations: s.sessionDurations ?? [],
    // Always populated by the backend (resolved against the program default),
    // so the table can render a value even when nothing is configured.
    effectiveSessionsPerWeek: s.effectiveSessionsPerWeek ?? 5,
    effectiveSessionMinutes: s.effectiveSessionMinutes ?? 60,
    // The backend always sends one entry per session. Fall back to a uniform
    // list from the resolved base so a consumer that indexes per position is
    // never handed a short array (e.g. an older response mid-rollout).
    effectiveSessionDurations: resolveEffectiveDurations(s),
    sessionRequirementSource: s.sessionRequirementSource ?? "default",

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

  deletionCheck: async (id: string): Promise<DeletionCheck> => {
    const res: AxiosResponse<ApiResponse<DeletionCheck>> =
      await client.get(`/subjects/${id}/deletion-check`);

    return res.data.data;
  },

  remove: async (id: string): Promise<{ id: string; outcome: "deleted" | "archived" }> => {
    const res: AxiosResponse<ApiResponse<{ id: string; outcome: "deleted" | "archived" }>> =
      await client.delete(`/subjects/${id}`);

    return res.data.data;
  },

  restore: async (id: string): Promise<Subject> => {
    const res: AxiosResponse<ApiResponse<SubjectResponse>> =
      await client.patch(`/subjects/${id}/restore`);

    return mapSubject(res.data.data);
  },
};