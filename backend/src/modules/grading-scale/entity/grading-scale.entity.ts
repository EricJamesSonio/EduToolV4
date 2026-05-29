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
  name!: string;
  programType!: string;
  ranges!: GradeRangeEntity[];
  isLocked!: boolean;
  lockedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class GradingScaleAssignmentEntity {
  id!: string;
  orgId!: string;
  gradingScaleId!: string;
  programId!: string;
  schoolYearId!: string;
  createdAt!: Date;
}