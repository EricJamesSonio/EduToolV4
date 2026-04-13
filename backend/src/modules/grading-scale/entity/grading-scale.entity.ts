export class GradeRangeEntity {
  minPercent!: number;
  maxPercent!: number;
  gradeValue!: string;
  remark!: string;
  isPassing!: boolean;
}

export class GradingScaleEntity {
  id!: string;
  orgId!: string;
  programId!: string; // CHANGED from levelId → programId
  schoolYearId!: string;
  name!: string;
  ranges!: GradeRangeEntity[];
  isLocked!: boolean;
  lockedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}