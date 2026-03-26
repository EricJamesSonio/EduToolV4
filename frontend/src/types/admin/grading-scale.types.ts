import { LevelSection } from "./level.types";

export interface GradeRange {
  id: string;
  minScore: number;
  maxScore: number;
  gradeValue: string;   // e.g. "A", "90", "1.0"
  remark: string;       // e.g. "Excellent"
  passed: boolean;
}

export interface GradingScale {
  id: string;
  orgId: string;
  name: string;
  levelSection: LevelSection;
  passingThreshold: number;
  ranges: GradeRange[];
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}