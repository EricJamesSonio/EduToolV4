import client from "@/api/client";

export interface SubjectPrerequisite {
  id: string;
  org_id: string;
  subject_id: string;
  prerequisite_id: string;
  created_at?: string;
  prerequisite?: {
    id: string;
    name: string;
    year_level?: string | null;
    term_label?: string | null;
  };
}

export interface PrerequisiteCheckResult {
  eligible: boolean;
  missing: Array<{
    subject_id: string;
    subject_name: string;
    reason: "not_taken" | "not_passed" | "not_locked";
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const subjectPrerequisiteApi = {
  getBySubject: async (subjectId: string): Promise<SubjectPrerequisite[]> => {
    const res = await client.get<ApiResponse<SubjectPrerequisite[]>>(
      "/subject-prerequisites",
      { params: { subject_id: subjectId } },
    );
    return res.data.data;
  },

  create: async (subjectId: string, prerequisiteId: string): Promise<SubjectPrerequisite> => {
    const res = await client.post<ApiResponse<SubjectPrerequisite>>(
      "/subject-prerequisites",
      { subject_id: subjectId, prerequisite_id: prerequisiteId },
    );
    return res.data.data;
  },

  bulkCreate: async (subjectId: string, prerequisiteIds: string[]): Promise<void> => {
    await client.post("/subject-prerequisites/bulk", {
      subject_id: subjectId,
      prerequisite_ids: prerequisiteIds,
    });
  },

  remove: async (subjectId: string, prerequisiteId: string): Promise<void> => {
    await client.delete(`/subject-prerequisites/${prerequisiteId}`, {
      params: { subject_id: subjectId },
    });
  },

  check: async (subjectId: string, studentId: string): Promise<PrerequisiteCheckResult> => {
    const res = await client.get<ApiResponse<PrerequisiteCheckResult>>(
      "/subject-prerequisites/check",
      { params: { subject_id: subjectId, student_id: studentId } },
    );
    return res.data.data;
  },
};

/** One student's eligibility for one subject. */
export interface StudentSubjectEligibility {
  eligible: boolean;
  missing: PrerequisiteCheckResult["missing"];
}

/** Eligibility keyed by student id, then subject id. */
export type StudentEligibilityMap = Record<
  string,
  Record<string, StudentSubjectEligibility>
>;

/**
 * Transposed batch check: one subject, many students.
 *
 * The enrollment surfaces need "who in this section is blocked?" rather than
 * "which classes is this student blocked from?". Batched server-side so a
 * whole section costs a fixed number of queries instead of one pair per
 * student.
 */
export const subjectPrerequisiteBatchApi = {
  checkBatch: async (
    subjectIds: string[],
    studentIds: string[],
  ): Promise<StudentEligibilityMap> => {
    if (subjectIds.length === 0 || studentIds.length === 0) return {};
    const res = await client.post<ApiResponse<StudentEligibilityMap>>(
      "/subject-prerequisites/check-batch",
      { subject_ids: subjectIds, student_ids: studentIds },
    );
    const payload = res.data?.data;

    // Guard the wire contract instead of silently returning {}. The backend
    // ResponseInterceptor wraps the handler result as { success, data }, so a
    // correctly-shaped response unwraps to a plain map of studentId -> subject
    // map. A nested `{ data: ... }` here means an envelope regression, and
    // returning {} would make every student look eligible — the same as the
    // feature not existing. Fail loudly so it surfaces as a query error.
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error(
        "Unexpected prerequisite batch response shape — expected a map of studentId -> subject results.",
      );
    }
    if (
      "data" in (payload as Record<string, unknown>)
    ) {
      throw new Error(
        "Prerequisite batch response was double-wrapped (data.data) — backend envelope regression.",
      );
    }

    return payload as StudentEligibilityMap;
  },
};