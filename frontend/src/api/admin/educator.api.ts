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
   * Server-resolved sections. Year-scoped view: this year's handled
   * sections. Global view: the UNION of handled sections across all years.
   * Render these, never a raw id.
   */
  sections: TeachableSubjectSection[];
  /**
   * Global subject key. The row id is a year subject id in the year-scoped
   * view and the key itself in the global view — this field matches the two
   * views (offered-in-year badge, Generated indicator).
   */
  subjectKey: string;
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

/** Other-year usage of one year-linked subject (untick confirm). */
export interface SubjectYearUsage {
  schoolYearId: string;
  schoolYearName: string;
  classCount: number;
  hasPicks: boolean;
}

export interface TeachableSubjectUsage {
  subjectId: string;
  subjectName: string;
  otherYears: SubjectYearUsage[];
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

  /** Other-year usage of this year's linked subjects (untick confirm). */
  getSubjectUsage: async (
    educatorId: string,
    schoolYearId: string,
  ): Promise<TeachableSubjectUsage[]> => {
    const res = await client.get<ApiResponse<TeachableSubjectUsage[]>>(
      `/educators/${educatorId}/subjects/usage`,
      { params: { schoolYearId } },
    );
    return res.data.data ?? [];
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

  /**
   * Removes global teachable keys (every year at once) plus the picks rows
   * whose subject carries a removed key. This is what the Subjects tab's
   * Remove button calls — the year-scoped bundle cannot remove a key that
   * has no subject in its year.
   */
  removeTeachableKeys: async (
    educatorId: string,
    keys: string[],
  ): Promise<{ removed: number }> => {
    const res = await client.post<ApiResponse<{ removed: number }>>(
      `/educators/${educatorId}/subject-keys/remove`,
      { keys },
    );
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