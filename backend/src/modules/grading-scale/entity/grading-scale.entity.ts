// src/modules/grading-scale/entity/grading-scale.entity.ts

export class GradeRangeEntity {
  minPercent: number;
  maxPercent: number;
  gradeValue: string; // e.g. "1.0", "A", "Excellent"
  remark: string;     // e.g. "Passed", "Failed"
  isPassing: boolean;
}

export class GradingScaleEntity {
  id: string;
  orgId: string;
  levelId: string;
  schoolYearId: string;
  name: string;
  ranges: GradeRangeEntity[];
  isLocked: boolean;
  lockedAt: Date | null;
  createdAt: Date;
}