import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

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
