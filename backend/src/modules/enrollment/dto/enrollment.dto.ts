import { IsUUID, IsIn, IsOptional } from 'class-validator';
export { PrerequisiteCheckResultDto } from '../../subject-prerequisite/dto/subject-prerequisite.dto';

export class EnrollStudentDto {
  @IsUUID()
  studentId!: string;
}

export class UpdateEnrollmentDto {
  @IsIn(['active', 'pending', 'removed'])
  status!: 'active' | 'pending' | 'removed';
}

export class EnrollmentQueryDto {
  @IsOptional()
  @IsIn(['active', 'pending', 'removed'])
  status?: 'active' | 'pending' | 'removed';
}
