import client from "../client";

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

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
    const res = await client.post(`/assessments/${assessmentId}/submit`);
    return unwrap<StartSubmissionResponse>(res.data);
  },

  saveDraft: async (assessmentId: string, data: SaveDraftRequest): Promise<SaveDraftResponse> => {
    const res = await client.patch(`/assessments/${assessmentId}/submit/save`, data);
    return unwrap<SaveDraftResponse>(res.data);
  },

  finish: async (assessmentId: string, data: FinishSubmissionRequest): Promise<FinishSubmissionResponse> => {
    const res = await client.post(`/assessments/${assessmentId}/submit/finish`, data);
    return unwrap<FinishSubmissionResponse>(res.data);
  },

  getOwn: async (assessmentId: string, submissionId: string): Promise<StartSubmissionResponse> => {
    const res = await client.get(`/assessments/${assessmentId}/submissions/${submissionId}/answers`);
    return unwrap<StartSubmissionResponse>(res.data);
  },
};
