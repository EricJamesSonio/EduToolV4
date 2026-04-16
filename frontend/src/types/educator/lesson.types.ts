export type ConceptBuildStatus =
  | "none"
  | "building"
  | "ready"
  | "outdated";

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
  subIndex: number;
  conceptBuild: LessonConcept | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Derived from backend week-structure
 */
export type WeekSlot = {
  label: string;
  value: number;
  termName: string;
  semesterName: string;
  semesterIndex: number;
};

/**
 * Optional enriched type for UI usage
 */
export type LessonWithWeekMeta = Lesson & {
  weekMeta?: WeekSlot;
};