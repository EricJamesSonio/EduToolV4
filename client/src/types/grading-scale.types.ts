// ===== client/src/types/grading-scale.types.ts =====

export interface GradeRange {
  minPercent: number;
  maxPercent: number;
  gradeValue: string; // e.g. "1.0", "A", "Excellent"
  remark: string;     // e.g. "Passed", "Failed"
  isPassing: boolean;
}

export interface GradingScale {
  id: string;
  orgId: string;
  programId: string;
  schoolYearId: string;
  name: string;
  ranges: GradeRange[];
  isLocked: boolean;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradingScaleDto {
  programId: string;
  schoolYearId: string;
  name: string;
  ranges: GradeRange[];
}

export interface UpdateGradingScaleDto {
  name?: string;
  ranges?: GradeRange[];
}

export interface QueryGradingScaleDto {
  programId?: string;
  schoolYearId?: string;
}