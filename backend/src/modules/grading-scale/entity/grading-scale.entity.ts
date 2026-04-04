// backend/src/modules/grading-scale/entity/grading-scale.entity.ts

export class GradeRangeEntity {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
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
  updatedAt: Date;  // added — backed by @updatedAt in Prisma schema
}