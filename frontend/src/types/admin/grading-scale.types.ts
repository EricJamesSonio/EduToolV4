// frontend/src/types/admin/grading-scale.types.ts

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
  levelId: string;
  schoolYearId: string;
  ranges: GradeRange[];
  isLocked: boolean;
  lockedAt: string | null;  // null when not locked
  createdAt: string;
  updatedAt?: string;       // optional — Prisma @updatedAt, serialized as ISO string
}