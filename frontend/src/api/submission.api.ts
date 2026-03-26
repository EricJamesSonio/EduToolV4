import client from "./client";

export interface AnswerInput {
  questionId: string;
  answer: string;
}

export interface StartSubmissionResponse {
  id: string;
  status: "draft";
  answers: AnswerInput[];
}

export interface SaveDraftRequest {
  answers: AnswerInput[];
}

export interface SaveDraftResponse {
  submissionId: string;
  savedAnswers: number;
}

export interface FinishSubmissionRequest {
  answers: AnswerInput[];
}

export interface FinishSubmissionResponse {
  submissionId: string;
  score: number;
  totalGraded: number;
  essayPending: boolean;
  submittedAt: string;
}

export const studentSubmissionApi = {
  start: async (assessmentId: string): Promise<StartSubmissionResponse> => {
    const res = await client.post<StartSubmissionResponse>(
      `/assessments/${assessmentId}/submit`
    );
    return res.data;
  },

  saveDraft: async (
    assessmentId: string,
    data: SaveDraftRequest
  ): Promise<SaveDraftResponse> => {
    const res = await client.patch<SaveDraftResponse>(
      `/assessments/${assessmentId}/submit/save`,
      data
    );
    return res.data;
  },

  finish: async (
    assessmentId: string,
    data: FinishSubmissionRequest
  ): Promise<FinishSubmissionResponse> => {
    const res = await client.post<FinishSubmissionResponse>(
      `/assessments/${assessmentId}/submit/finish`,
      data
    );
    return res.data;
  },

  getOwn: async (
    assessmentId: string,
    submissionId: string
  ): Promise<StartSubmissionResponse> => {
    const res = await client.get<StartSubmissionResponse>(
      `/assessments/${assessmentId}/submissions/${submissionId}/answers`
    );
    return res.data;
  },
};