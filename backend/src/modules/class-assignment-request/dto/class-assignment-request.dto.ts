import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
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
  adminFinalizedSubjectIds?: string[];
}

export class FinalizeClassAssignmentRequestDto {
  @IsArray()
  @IsString({ each: true })
  adminFinalizedSubjectIds!: string[];
}

export class ReopenClassAssignmentRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
