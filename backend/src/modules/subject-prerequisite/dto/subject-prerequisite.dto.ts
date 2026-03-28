import { IsString, IsNotEmpty, IsArray } from 'class-validator'

export class CreatePrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  org_id: string

  @IsString()
  @IsNotEmpty()
  subject_id: string

  @IsString()
  @IsNotEmpty()
  prerequisite_id: string
}

export class BulkCreatePrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  org_id: string

  @IsString()
  @IsNotEmpty()
  subject_id: string

  @IsArray()
  @IsString({ each: true })
  prerequisite_ids: string[]
}

export class PrerequisiteCheckDto {
  @IsString()
  @IsNotEmpty()
  subject_id: string

  @IsString()
  @IsNotEmpty()
  student_id: string
}

export class PrerequisiteCheckResultDto {
  eligible: boolean
  missing: {
    subject_id: string
    subject_name: string
    reason: 'not_taken' | 'not_passed' | 'not_locked'
  }[]
}