import apiClient from "@/api/client";

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

export interface StudentAssessmentItem {
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;
  submissionStatus: "not_started" | "draft" | "submitted" | "graded" | "exempted" | string;
  submittedAt: string | null;
}

export interface StudentAssessmentDetail {
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;
  gradingMode: string;
  locked: boolean;
  questions?: Array<{
    id: string;
    order: number;
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
  gradingMode: string;
  totalItems: number;
  questions?: Array<{
    id: string;
    questionText: string;
    type: string;
    correctAnswer: string | null;
    choices?: string[];
    order: number;
    studentAnswer: string | null;
    isCorrect: boolean | null;
  }>;
}

export const studentAssessmentApi = {
  getAll: async (classId: string): Promise<StudentAssessmentItem[]> => {
    const { data } = await apiClient.get(`/student/classes/${classId}/assessments`);
    return unwrap<StudentAssessmentItem[]>(data);
  },

  getOne: async (classId: string, assessmentId: string): Promise<StudentAssessmentDetail> => {
    const { data } = await apiClient.get(`/student/classes/${classId}/assessments/${assessmentId}`);
    return unwrap<StudentAssessmentDetail>(data);
  },

  getResult: async (classId: string, assessmentId: string): Promise<AssessmentResult> => {
    const { data } = await apiClient.get(`/student/classes/${classId}/assessments/${assessmentId}/result`);
    return unwrap<AssessmentResult>(data);
  },
};
