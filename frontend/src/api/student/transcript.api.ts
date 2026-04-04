// src/api/student/transcript.api.ts
import apiClient from "@/api/client";

// ── Types (mirror the backend groupTranscript() output) ───────────────────────

export interface TranscriptTermGrade {
  termId: string;
  termName: string;
  orderIndex: number;
  finalScore: number | null;
  finalGrade: string | null;
  isReleased: boolean;
}

export interface TranscriptClass {
  classId: string;
  subject: { id: string | null; name: string };
  educator: string;
  termGrades: TranscriptTermGrade[];
}

export interface TranscriptSemester {
  semesterId: string;
  semesterName: string;
  classes: TranscriptClass[];
}

export interface TranscriptYear {
  schoolYearId: string;
  schoolYearName: string;
  schoolYearStatus: string;
  semesters: TranscriptSemester[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const transcriptApi = {
  getMyTranscript: async (): Promise<TranscriptYear[]> => {
    const { data } = await apiClient.get("/student/transcript");
    return Array.isArray(data) ? data : (data?.data ?? []);
  },
};