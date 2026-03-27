import client from "@/api/client";
import type { Submission } from "@/types/educator/submission.types";

export interface SubmissionAnswerDetail {
  question: {
    id: string;
    questionText: string;
    type: string;
    choices?: string[];
    correctAnswer?: string;
  };
  answer: string;
}

export const submissionApi = {
  getSubmissions: async (
    classId: string,
    assessmentId: string
  ): Promise<Submission[]> => {
    const res = await client.get<Submission[]>(
      `/classes/${classId}/assessments/${assessmentId}/submissions`
    );
    return res.data;
  },
  getAnswers: async (
    assessmentId: string,
    submissionId: string
  ): Promise<SubmissionAnswerDetail[]> => {
    const res = await client.get<SubmissionAnswerDetail[]>(
      `/assessments/${assessmentId}/submissions/${submissionId}/answers`
    );
    return res.data;
  },
  updateStatus: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    status: "exempted" | "custom",
    manualScore?: number
  ): Promise<Submission> => {
    const res = await client.patch<Submission>(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/status`,
      { status, manualScore }
    );
    return res.data;
  },
  gradeEssay: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    score: number
  ): Promise<Submission> => {
    const res = await client.patch<Submission>(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/grade`,
      { score }
    );
    return res.data;
  },
};