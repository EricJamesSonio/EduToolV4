export interface GradeRange {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
  isPassing: boolean;
}

export interface GradingScale {
  id: string;
  orgId: string;
  name: string;
  programType: string;
  ranges: GradeRange[];
  isLocked: boolean;
  lockedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GradingScaleAssignment {
  id: string;
  orgId: string;
  gradingScaleId: string;
  programId: string;
  schoolYearId: string;
  createdAt: string;
  grading_scale?: { name: string };
  program?: { name: string };
}
