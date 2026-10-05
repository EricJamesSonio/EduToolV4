import { IsString, IsArray, IsUUID, ArrayMaxSize } from 'class-validator';

export class CreatePrerequisiteDto {
  @IsUUID()
  subject_id: string;

  @IsUUID()
  prerequisite_id: string;
}

export class BulkCreatePrerequisiteDto {
  @IsUUID()
  subject_id: string;

  @IsArray()
  @IsString({ each: true })
  prerequisite_ids: string[];
}

export class PrerequisiteCheckDto {
  @IsUUID()
  subject_id: string;

  @IsUUID()
  student_id: string;
}

export class PrerequisiteCheckResultDto {
  eligible: boolean;
  missing: {
    subject_id: string;
    subject_name: string;
    reason: 'not_taken' | 'not_passed' | 'not_locked';
  }[];
}

/**
 * Admin-facing batch check: one subject, many students.
 *
 * `subject_ids` is an array so the same contract serves the transposed
 * (many-subjects / one-student) caller; today the enrollment surfaces only
 * ever send a single class subject.
 */
export class BatchPrerequisiteCheckDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMaxSize(50, { message: 'subject_ids must contain at most 50 entries' })
  subject_ids: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMaxSize(500, {
    message: 'student_ids must contain at most 500 entries',
  })
  student_ids: string[];
}
