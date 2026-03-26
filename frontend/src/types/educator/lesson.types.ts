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
  conceptBuild: LessonConcept | null;
  createdAt: string;
  updatedAt: string;
}