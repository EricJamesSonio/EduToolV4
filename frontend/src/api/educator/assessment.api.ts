// filepath: frontend/src/api/educator/assessment.api.ts
import apiClient from "@/api/client";
import type { Assessment, Question, Choice, GenerationStatus } from "@/types/educator/assessment.types";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

function toChoices(raw: unknown): Choice[] | null {
  if (!Array.isArray(raw)) return null;
  const labels = ["A", "B", "C", "D"] as const;
  return raw.slice(0, 4).map((text, i) => ({ label: labels[i], text: String(text) }));
}

function mapQuestion(raw: Record<string, unknown>): Question {
  return {
    id: raw.id as string,
    assessmentId: (raw.assessment_id ?? raw.assessmentId) as string,
    order: (raw.order ?? 0) as number,
    type: (raw.type) as Question["type"],
    text: (raw.question_text ?? raw.text) as string,
    choices: toChoices(raw.choices),
    correctAnswer: (raw.correct_answer ?? raw.correctAnswer ?? null) as string | null,
    points: (raw.points ?? 1) as number,
    isLocked: (raw.is_locked ?? raw.isLocked ?? false) as boolean,
  };
}

function mapAssessment(raw: Record<string, unknown>): Assessment {
  const questions = Array.isArray(raw.questions)
    ? (raw.questions as Record<string, unknown>[]).map(mapQuestion)
    : [];

  const lessonTitle = (raw.lesson_title ?? raw.lessonTitle ?? "") as string;
  const type = (raw.type ?? "quiz") as Assessment["type"];

  return {
    id: raw.id as string,
    classId: (raw.class_id ?? raw.classId) as string,
    lessonId: (raw.lesson_id ?? raw.lessonId) as string,
    lessonTitle,
    title: lessonTitle
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} — ${lessonTitle}`
      : type.charAt(0).toUpperCase() + type.slice(1),
    type,
    termId: (raw.term_id ?? raw.termId) as string,
    termName: (raw.term_name ?? raw.termName ?? "") as string,
    totalItems: (raw.total_items ?? raw.totalItems) as number,
    releaseDate: (raw.release_date ?? raw.releaseDate ?? null) as string,
    endDate: (raw.end_date ?? raw.endDate ?? null) as string,
    status: deriveStatus(raw),
    assignedStudentIds: (raw.assigned_student_ids ?? raw.assignedStudentIds ?? null) as string[] | null,
    submittedCount: (raw.submitted_count ?? raw.submittedCount ?? 0) as number,
    pendingEssayCount: (raw.pending_essay_count ?? raw.pendingEssayCount ?? 0) as number,
    questions,
    isPublished: (raw.is_published ?? raw.isPublished ?? false) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? raw.createdAt) as string,
  };
}

function deriveStatus(raw: Record<string, unknown>): Assessment["status"] {
  const now = new Date();
  const release = raw.release_date ?? raw.releaseDate;
  const end = raw.end_date ?? raw.endDate;
  if (release && now < new Date(release as string)) return "upcoming";
  if (end && now > new Date(end as string)) return "closed";
  return "open";
}

function mapSubmission(raw: Record<string, unknown>): Submission {
  return {
    id: raw.id as string,
    assessmentId: (raw.assessment_id ?? raw.assessmentId) as string,
    studentId: (raw.student_id ?? raw.studentId) as string,
    studentName: (raw.student_name ?? raw.studentName ?? "") as string,
    studentCode: (raw.student_code ?? raw.studentCode ?? "") as string,
    status: (raw.status ?? "not_started") as Submission["status"],
    score: (raw.score ?? null) as number | null,
    totalPoints: (raw.total_points ?? raw.totalPoints ?? 0) as number,
    isPublished: (raw.is_published ?? raw.isPublished ?? false) as boolean,
    essayGraded: (raw.essay_graded ?? raw.essayGraded ?? false) as boolean,
    answers: (raw.answers ?? []) as Submission["answers"],
    startedAt: (raw.started_at ?? raw.startedAt ?? null) as string | null,
    submittedAt: (raw.submitted_at ?? raw.submittedAt ?? null) as string | null,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? "") as string,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const assessmentApi = {
  getAll: async (classId: string, params?: { termId?: string; type?: string }): Promise<Assessment[]> => {
    const { data } = await apiClient.get(`/classes/${classId}/assessments`, { params });
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapAssessment);
  },

  getOne: async (classId: string, assessmentId: string): Promise<Assessment> => {
    const { data } = await apiClient.get(`/classes/${classId}/assessments/${assessmentId}`);
    return mapAssessment(unwrap<Record<string, unknown>>(data));
  },

  create: async (classId: string, body: CreateAssessmentRequest): Promise<Assessment> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments`, body);
    return mapAssessment(unwrap<Record<string, unknown>>(data));
  },

  update: async (classId: string, assessmentId: string, body: UpdateAssessmentRequest): Promise<Assessment> => {
    const { data } = await apiClient.patch(`/classes/${classId}/assessments/${assessmentId}`, body);
    return mapAssessment(unwrap<Record<string, unknown>>(data));
  },

  delete: async (classId: string, assessmentId: string): Promise<void> => {
    await apiClient.delete(`/classes/${classId}/assessments/${assessmentId}`);
  },

  updateQuestion: async (
    classId: string,
    assessmentId: string,
    questionId: string,
    body: UpdateQuestionRequest,
  ): Promise<Question> => {
    const { data } = await apiClient.patch(
      `/classes/${classId}/assessments/${assessmentId}/questions/${questionId}`,
      body,
    );
    return mapQuestion(unwrap<Record<string, unknown>>(data));
  },

  getSubmissions: async (classId: string, assessmentId: string): Promise<Submission[]> => {
    const { data } = await apiClient.get(`/classes/${classId}/assessments/${assessmentId}/submissions`);
    const list = unwrap<Record<string, unknown>[]>(data);
    return list.map(mapSubmission);
  },

  updateSubmissionStatus: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    body: UpdateSubmissionStatusRequest,
  ): Promise<Submission> => {
    const { data } = await apiClient.patch(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/status`,
      body,
    );
    return mapSubmission(unwrap<Record<string, unknown>>(data));
  },

  gradeEssay: async (
    classId: string,
    assessmentId: string,
    submissionId: string,
    body: GradeEssayRequest,
  ): Promise<Submission> => {
    const { data } = await apiClient.patch(
      `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/grade`,
      body,
    );
    return mapSubmission(unwrap<Record<string, unknown>>(data));
  },

  publish: async (classId: string, assessmentId: string, body?: PublishScoresRequest): Promise<{ success: true }> => {
    const { data } = await apiClient.post(
      `/classes/${classId}/assessments/${assessmentId}/publish`,
      body,
    );
    return unwrap<{ success: true }>(data);
  },

  unpublish: async (classId: string, assessmentId: string): Promise<{ success: true }> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments/${assessmentId}/unpublish`);
    return unwrap<{ success: true }>(data);
  },

  reopen: async (classId: string, assessmentId: string, studentIds: string[], reopenedUntil: string): Promise<{ success: true; reopened: number }> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments/${assessmentId}/reopen`, { studentIds, reopenedUntil });
    return unwrap<{ success: true; reopened: number }>(data);
  },

  assignStudents: async (classId: string, assessmentId: string, studentIds: string[]): Promise<{ success: true; assigned: number }> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments/${assessmentId}/assign-students`, { studentIds });
    return unwrap<{ success: true; assigned: number }>(data);
  },

  getGenerationStatus: async (classId: string, assessmentId: string): Promise<GenerationStatus> => {
    const { data } = await apiClient.get(`/classes/${classId}/assessments/${assessmentId}/generation-status`);
    return unwrap<GenerationStatus>(data);
  },

  // ─── Preview flow ───

  generatePreview: async (classId: string, body: CreateAssessmentRequest): Promise<{ previewId: string }> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments/generate-preview`, body);
    return unwrap<{ previewId: string }>(data);
  },

  getPreview: async (classId: string, previewId: string): Promise<GenerationStatus & { questions?: any[] }> => {
    const { data } = await apiClient.get(`/classes/${classId}/assessments/preview/${previewId}`);
    return unwrap<any>(data);
  },

  confirmPreview: async (classId: string, previewId: string): Promise<Assessment> => {
    const { data } = await apiClient.post(`/classes/${classId}/assessments/preview/${previewId}/confirm`);
    return mapAssessment(unwrap<Record<string, unknown>>(data));
  },

  cancelPreview: async (classId: string, previewId: string): Promise<void> => {
    await apiClient.delete(`/classes/${classId}/assessments/preview/${previewId}`);
  },
};