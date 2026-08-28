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
