import { IsUUID, IsIn, IsOptional } from 'class-validator'

export class EnrollStudentDto {
  @IsUUID()
  studentId: string
}

export class UpdateEnrollmentDto {
  @IsIn(['active', 'pending', 'removed'])
  status: 'active' | 'pending' | 'removed'
}

export class EnrollmentQueryDto {
  @IsOptional()
  @IsIn(['active', 'pending', 'removed'])
  status?: 'active' | 'pending' | 'removed'
}

export class PrerequisiteCheckResultDto {
  eligible: boolean
  missing: {
    subject_id: string
    subject_name: string
    reason: 'not_taken' | 'not_passed' | 'not_locked'
  }[]
}