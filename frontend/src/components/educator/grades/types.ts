export type ViewMode = "default" | "clean";

export interface PendingEdit {
  studentId: string;
  category: string;
  value: string;
}

export interface ReadinessIssue {
  type: "missing_submission" | "missing_category_assessment"
  termId?: string
  termName?: string
  studentId?: string
  studentName?: string
  studentCode?: string
  assessmentId?: string
  assessmentTitle?: string
  category?: string
}
