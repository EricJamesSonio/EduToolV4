export interface TranscriptSubjectEntry {
  subjectId: string;
  subjectTitle: string;
  termGrade: number | null;
  finalGrade: number | null;
  remark: string | null;      // "Passed" | "Failed"
  gradingScaleLabel: string | null;
  status: "completed" | "in_progress" | "dropped";
}

export interface TranscriptTerm {
  termId: string;
  termName: string;
  subjects: TranscriptSubjectEntry[];
}

export interface TranscriptSemester {
  semesterId: string;
  semesterName: string;
  terms: TranscriptTerm[];
}

export interface TranscriptYear {
  schoolYearId: string;
  schoolYearTitle: string;
  semesters: TranscriptSemester[];
}

export interface Transcript {
  studentId: string;
  studentName: string;
  studentCode: string;
  years: TranscriptYear[];
}