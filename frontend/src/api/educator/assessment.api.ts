import client from "@/api/client";
import type {
  Assessment,
  Question,
} from "@/types/educator/assessment.types";
import type { Submission } from "@/types/educator/submission.types";

export interface RangeConfig {
  from: number;
  to: number;
  questionType:
    | "multiple_choice"
    | "true_or_false"
    | "identification"
    | "enumeration"
    | "essay";
  conceptSections: string[];
}

export interface CreateAssessmentRequest {
  lessonId: string;
  termId: string;
  type: "quiz" | "activity" | "exam" | "custom";
  totalItems: number;
  ranges: RangeConfig[];
  releaseDate?: string;
  endDate?: string;
}

export interface UpdateAssessmentRequest {
  type?: "quiz" | "activity" | "exam" | "custom";
  releaseDate?: string;
  endDate?: string;
}

export interface UpdateQuestionRequest {
  questionText?: string;
  correctAnswer?: string;
  choices?: string[];
}

export interface UpdateSubmissionStatusRequest {
  status: "exempted" | "custom";
  manualScore?: number;
}

export interface GradeEssayRequest {
  score: number;
}

export interface PublishScoresRequest {
  studentIds?: string[];
}

export const assessmentApi = {
  getAll: async (classId: string): Promise<Assessment[]> => {
    const res = await client.get<Assessment[]>(
      `/classes/${classId}/assessments`
    );
    return res.data;
  },

  getOne: async (classId: string, assessmentId: string): Promise<Assessment> => {
    const res = await client.get<Assessment>(
      `/classes/${classId}/assessments/${assessmentId}`
    );
    return res.data;
  },

  create: async (
    classId: string,
    data: CreateAssessmentRequest
  ): Promise<Assessment> => {
    const res = await client.post<Assessment>(
      `/classes/${classId}/assessments`,
      data
    );
    return res.data;
  },

  update: async (
    classId: string,
    assessmentId: string,
    data: UpdateAssessmentRequest
  ): Promise<Assessment> => {
    const res = await client.patch<Assessment>(
      `/classes/${classId}/assessments/${assessmentId}`,
      data
    );
    return res.data;
  },

  delete: async (classId: string, assessmentId: string): Promise<void> => {
    await client.delete(`/classes/${classId}/assessments/${assessmentId}`);
  },

  updateQuestion: async (
    classId: string,
    assessmentId: string,
    questionId: string,
    data: UpdateQuestionRequest
  ): Promise<Question> => {
    const res = await client.patch<Question>(
      `/classes/${classId}/assessments/${assessmentId}/questions/${questionId}`,
      data
    );
    return res.data;
  },

  getSubmissions: async (
    classId: string,
    assessmentId: string
  ): Promise<Submission[]> => {
    const res = await client.get<Submission[]>(
      `/classes/${classId}/assessments/${assessmentId}/submissions`
    );
    return res.data;
  },

  updateSubmissionStatus: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    data: UpdateSubmissionStatusRequest
  ): Promise<Submission> => {
    const res = await client.patch<Submission>(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/status`,
      data
    );
    return res.data;
  },

  gradeEssay: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    data: GradeEssayRequest
  ): Promise<Submission> => {
    const res = await client.patch<Submission>(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/grade`,
      data
    );
    return res.data;
  },

  publish: async (
    classId: string,
    assessmentId: string,
    data?: PublishScoresRequest
  ): Promise<{ success: true }> => {
    const res = await client.post<{ success: true }>(
      `/classes/${classId}/assessments/${assessmentId}/publish`,
      data
    );
    return res.data;
  },

  unpublish: async (
    classId: string,
    assessmentId: string
  ): Promise<{ success: true }> => {
    const res = await client.post<{ success: true }>(
      `/classes/${classId}/assessments/${assessmentId}/unpublish`
    );
    return res.data;
  },
};