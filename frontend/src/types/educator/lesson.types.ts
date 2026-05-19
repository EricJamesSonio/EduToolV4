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
  content: any;
  createdAt: string;
}

export interface Lesson {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  detail: string | null;
  weekNumber: number;
  subIndex: number;

  concept?: any | null; // backend returns raw LessonConcept JSON

  createdAt: string;
}

/**
 * Derived from backend week-structure
 */
export type WeekSlot = {
  label: string;
  value: number;
  globalWeek: number;
  termWeek: number;
  semesterWeek: number;
  termName: string;
  termId: string;
  semesterName: string;
  semesterIndex: number;
  date: string;
};
/**
 * Optional enriched type for UI usage
 */
export type LessonWithWeekMeta = Lesson & {
  weekMeta?: WeekSlot;
};