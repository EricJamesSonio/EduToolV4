import client from "@/api/client";
import type { Educator } from "@/types/admin/educator.types";
import type { DeletionCheck } from "@/types/admin/deletion.types";
import type { PaginatedResponse } from "@/types/api.types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SELECT_LIMIT = 5000;

export interface CreateEducatorRequest {
  fullName:  string;
  emailName: string;
}

export interface CreateEducatorResponse extends Educator {
  plainPassword: string; // show once
}

export interface BulkCreateEducatorResult {
  fullName:     string;
  email:        string;
  educatorId:   string;
  plainPassword: string;
}

export interface BulkSkippedRow {
  row:    number;
  email:  string;
  reason: string;
}

export interface BulkCreateResponse {
  created: BulkCreateEducatorResult[];
  skipped: BulkSkippedRow[];
}

export interface UpdateEducatorRequest {
  fullName?:     string;
  email?:        string;
  emailName?:    string;
  profileImage?: string;
}

// ── Teachable subjects (Phase 3) ────────────────────────────────────────────

/** A subject an educator is able to teach, with the context needed to group it. */
export interface TeachableSubjectSection {
  sectionId: string;
  name: string;
  levelName: string | null;
  slots: number[];
}

export interface TeachableSubject {
  id: string;
  name: string;
  programId: string | null;
  programName: string | null;
  programType: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
  /** Sections this educator handles for the subject. */
  sectionIds: string[];
  /** Weekly slot positions picked per section. */
  sectionSlots: Array<{ sectionId: string; slots: number[] }>;
  /**
   * Server-resolved sections for the requested school year. Empty when the
   * request did not scope to a year — render these, never a raw id.
   */
  sections: TeachableSubjectSection[];
}

export interface SubjectSlotPick {
  sectionId: string;
  /** 1-based weekly positions, e.g. [1, 2] of a 2x/week subject. */
  slots: number[];
}

export interface SubjectSlotAssignment {
  subjectId: string;
  sections: SubjectSlotPick[];
}

export interface SetSubjectSlotsResponse {
  updated: number;
}

export interface SetTeachableBundleRequest {
  schoolYearId: string;
  subjectIds: string[];
  assignments: SubjectSlotAssignment[];
}

export interface SetTeachableBundleResponse {
  count: number;
  updated: number;
  pickedMin: number;
}

export interface EducatorCapacity {
  capacityMin: number;
  existingMin: number;
  pickedMin: number;
  remainingMin: number;
  effectiveWeekdays: number[];
  windowStart: string;
  windowEnd: string;
  slotDuration: number;
}

export interface SetEducatorSubjectsRequest {
  subjectIds: string[];
}

export interface CarryOverEducatorSubjectsRequest {
  fromSchoolYearId: string;
  toSchoolYearId: string;
  educatorIds?: string[];
}

export interface CarryOverUnmatched {
  educatorId: string;
  subjectName: string;
  reason: string;
}

export interface CarryOverEducatorSubjectsResponse {
  created: number;
  sectionsCarried: number;
  educatorsProcessed: number;
  unmatched: CarryOverUnmatched[];
}

/** An educator who can teach a given subject. */
export interface SubjectEducator {
  id: string;
  status: string;
  fullName: string | null;
  educatorId: string | null;
}

// ── Availability (Phase 4) ─────────────────────────────────────────────────

export interface EducatorScheduleProfile {
  educatorId: string;
  /** false = available on every school day (the default, no setup needed). */
  useCustomAvailability: boolean;
  /** Raw configured days, which may include days the school is closed. */
  availableWeekdays: number[];
  maxMinutesPerDay: number | null;
  maxMinutesPerWeek: number | null;
  /** Raw days INTERSECTED with the org's school days — always what you can use. */
  effectiveWeekdays: number[];
  /** Only present on the PUT response: existing classes outside the new days. */
  outsideAvailabilityClassCount?: number;
}

export interface SetEducatorScheduleProfileRequest {
  useCustomAvailability: boolean;
  availableWeekdays: number[];
}

export interface GetEducatorsQuery {
  search?: string;
  status?: string;
  page?:   number;
  limit?:  number;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const educatorApi = {
  getPage: async (query?: GetEducatorsQuery): Promise<PaginatedResponse<Educator>> => {
    const params = query
      ? Object.fromEntries(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;
    const res = await client.get<ApiResponse<PaginatedResponse<Educator>>>("/educators", { params });
    return res.data.data;
  },

  getAll: async (search?: string): Promise<Educator[]> => {
    const result = await educatorApi.getPage({ search: search || undefined, limit: MAX_SELECT_LIMIT });
    return result.data;
  },

  getOne: async (id: string): Promise<Educator> => {
    const res = await client.get<ApiResponse<Educator>>(`/educators/${id}`);
    return res.data.data;
  },

  create: async (data: CreateEducatorRequest): Promise<CreateEducatorResponse> => {
    const res = await client.post<ApiResponse<CreateEducatorResponse>>("/educators", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateEducatorRequest): Promise<Educator> => {
    const res = await client.patch<ApiResponse<Educator>>(`/educators/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/educators/${id}`);
  },

  deletionCheck: async (id: string): Promise<DeletionCheck> => {
    const res = await client.get<ApiResponse<DeletionCheck>>(`/educators/${id}/deletion-check`);
    return res.data.data;
  },

  resetPassword: async (id: string): Promise<{ id: string; plainPassword: string }> => {
    const res = await client.post<ApiResponse<{ id: string; plainPassword: string }>>(
      `/educators/${id}/reset-password`
    );
    return res.data.data;
  },

  bulkCreate: async (entries: { fullName: string; id: string }[]): Promise<BulkCreateResponse> => {
    const res = await client.post<ApiResponse<any>>(
      "/educators/bulk", { entries }
    );
    const data = res.data.data;
    if (Array.isArray(data)) return { created: data, skipped: [] };
    return data as BulkCreateResponse;
  },

  // ── Teachable subjects (Phase 3) ──────────────────────────────────────────

  getTeachableSubjects: async (
    educatorId: string,
    schoolYearId?: string,
  ): Promise<TeachableSubject[]> => {
    const res = await client.get<ApiResponse<TeachableSubject[]>>(
      `/educators/${educatorId}/subjects`,
      schoolYearId ? { params: { schoolYearId } } : undefined,
    );
    return res.data.data ?? [];
  },

  /** Replaces the whole set. Unknown/cross-org ids are rejected, not dropped. */
  setTeachableSubjects: async (
    educatorId: string,
    subjectIds: string[]
  ): Promise<{ count: number }> => {
    const res = await client.put<ApiResponse<{ count: number }>>(
      `/educators/${educatorId}/subjects`,
      { subjectIds }
    );
    return res.data.data;
  },

  /** Weekly capacity breakdown for the assignment UI. */
  getCapacity: async (
    educatorId: string,
    schoolYearId: string,
  ): Promise<EducatorCapacity> => {
    const res = await client.get<ApiResponse<EducatorCapacity>>(
      `/educators/${educatorId}/capacity`,
      { params: { schoolYearId } },
    );
    return res.data.data;
  },

  /** Replaces which weekly slot positions the educator handles per subject. */
  setSubjectSlots: async (
    educatorId: string,
    schoolYearId: string,
    assignments: SubjectSlotAssignment[],
  ): Promise<SetSubjectSlotsResponse> => {
    const res = await client.put<ApiResponse<SetSubjectSlotsResponse>>(
      `/educators/${educatorId}/subject-slots`,
      { schoolYearId, assignments },
    );
    return res.data.data;
  },

  /**
   * One atomic save: replaces the link set AND the slot picks in a single
   * transaction. Any validation failure leaves existing links untouched.
   */
  setTeachableBundle: async (
    educatorId: string,
    body: SetTeachableBundleRequest,
  ): Promise<SetTeachableBundleResponse> => {
    const res = await client.put<ApiResponse<SetTeachableBundleResponse>>(
      `/educators/${educatorId}/subject-bundle`,
      body,
    );
    return res.data.data;
  },

  /** Copies teachable subjects from one school year to another. */
  carryOverTeachableSubjects: async (
    body: CarryOverEducatorSubjectsRequest
  ): Promise<CarryOverEducatorSubjectsResponse> => {
    const res = await client.post<
      ApiResponse<CarryOverEducatorSubjectsResponse>
    >("/educators/carry-over-subjects", body);
    return res.data.data;
  },

  /** Educators who can teach a subject — drives the class dialog's suggestions. */
  getSubjectEducators: async (subjectId: string): Promise<SubjectEducator[]> => {
    const res = await client.get<ApiResponse<SubjectEducator[]>>(
      `/subjects/${subjectId}/educators`
    );
    return res.data.data ?? [];
  },

  // ── Availability (Phase 4) ───────────────────────────────────────────────

  getScheduleProfile: async (
    educatorId: string
  ): Promise<EducatorScheduleProfile> => {
    const res = await client.get<ApiResponse<EducatorScheduleProfile>>(
      `/educators/${educatorId}/schedule-profile`
    );
    return res.data.data;
  },

  setScheduleProfile: async (
    educatorId: string,
    body: SetEducatorScheduleProfileRequest
  ): Promise<EducatorScheduleProfile> => {
    const res = await client.put<ApiResponse<EducatorScheduleProfile>>(
      `/educators/${educatorId}/schedule-profile`,
      body
    );
    return res.data.data;
  },
};