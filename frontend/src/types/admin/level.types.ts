export type LevelSection =
  | "elementary"
  | "junior_high"
  | "senior_high"
  | "college"
  | "custom";

export interface GradeLevel {
  id: string;
  name: string;       // e.g. "Grade 7", "Year 1"
  order: number;
}

export interface LevelDefault {
  id: string;
  orgId: string;
  levelSection: LevelSection;
  gradeLevels: GradeLevel[];
  updatedAt: string;
}

export interface SchoolYearLevel {
  id: string;
  schoolYearId: string;
  levelSection: LevelSection;
  gradeLevels: GradeLevel[];
}