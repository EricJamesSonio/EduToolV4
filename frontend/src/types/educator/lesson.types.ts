// ===== File: frontend/src/types/educator/lesson.types.ts =====

// NOTE:
// WeekSlot is now defined and exported from:
// "@/hooks/educator/useClassWeeks"
// Import it from there when needed instead of redefining here.

export type ConceptBuildStatus = "none" | "building" | "ready" | "outdated";

export interface ConceptSection {
  id: string;
  name: string;
  keywordCount: number;
}

export interface LessonConcept {
  id: string;
  lessonId: string;
  status: ConceptBuildStatus;
  sections: ConceptSection[];
  totalItems: number;
  builtAt: string | null;
}

export interface Lesson {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  detail: string;

  weekNumber: number;
  subIndex: number; // ✅ added (for ordering within the week)

  conceptBuild: LessonConcept | null;

  createdAt: string;
  updatedAt: string;
}