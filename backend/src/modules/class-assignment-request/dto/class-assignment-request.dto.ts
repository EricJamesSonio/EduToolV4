import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

export class CreateClassAssignmentRequestDto {
  @IsString()
  @IsNotEmpty()
  studentSchoolYearId!: string;

  @IsOptional()
  @IsString()
  programEnrollmentId?: string;

  @IsEnum(['student_request', 'admin_flag'] as const)
  origin!: 'student_request' | 'admin_flag';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentRequestedSubjectIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentRequestedClassIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminFinalizedSubjectIds?: string[];
}

export class FinalizeClassAssignmentRequestDto {
  /**
   * Classes the admin approves. Approved classes are enrolled immediately;
   * every other requested class counts as denied. An empty array is valid
   * (deny everything).
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedClassIds?: string[];

  /** Legacy subject-level finalize (no enrollment). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminFinalizedSubjectIds?: string[];
}

export class ReopenClassAssignmentRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}