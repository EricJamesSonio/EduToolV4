import apiClient from "@/api/client";

type Envelope<T> = { success: boolean; data: T };

export interface UngradedStudent {
  studentId: string;
  name: string;
  code: string;
  missingTerms: string[];
}

export interface ClassSubmissionStatus {
  classId: string;
  semesterName: string | null;
  semesterEndDate: string | null;
  canSubmit: boolean;
  templateCount: number;
  submittedAt: string | null;
  totalStudents: number;
  ungraded: UngradedStudent[];
}

export interface ClassSubmitResult {
  templatesUpdated: number;
  rowsWritten: number;
  ambiguousRows: number;
  ungraded: number;
  unmatched: number;
}

export const classGradeSubmissionApi = {
  status: async (classId: string): Promise<ClassSubmissionStatus> => {
    const { data } = await apiClient.get<Envelope<ClassSubmissionStatus>>(
      `/grade-templates/class/${classId}/submission-status`,
    );
    return data.data;
  },

  submit: async (classId: string): Promise<ClassSubmitResult> => {
    const { data } = await apiClient.post<Envelope<ClassSubmitResult>>(
      `/grade-templates/class/${classId}/submit`,
    );
    return data.data;
  },
};