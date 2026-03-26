import apiClient from "@/api/client";

export interface StudentAssessmentItem {
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;
  submissionStatus: "not_started" | "submitted" | "graded" | string;
  submittedAt: string | null;
}

export interface StudentAssessmentDetail {
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;
  locked: boolean;
  questions?: Array<{
    id: string;
    questionText: string;
    type: string;
    choices?: string[];
  }>;
}

export interface AssessmentResult {
  status: string;
  submittedAt: string;
  score: number | null;
  isPublished: boolean;
}

export const studentAssessmentApi = {
  getAll: async (classId: string): Promise<StudentAssessmentItem[]> => {
    const { data } = await apiClient.get(
      `/classes/${classId}/assessments`
    );
    return data;
  },

  getOne: async (
    classId: string,
    assessmentId: string
  ): Promise<StudentAssessmentDetail> => {
    const { data } = await apiClient.get(
      `/classes/${classId}/assessments/${assessmentId}`
    );
    return data;
  },

  getResult: async (
    classId: string,
    assessmentId: string
  ): Promise<AssessmentResult> => {
    const { data } = await apiClient.get(
      `/classes/${classId}/assessments/${assessmentId}/result`
    );
    return data;
  },
};