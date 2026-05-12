// Academic Context DTO
// Data transfer object for academic context response

import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum GradeLockStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export class AcademicContextDto {
  @IsString()
  schoolYear: string;

  @IsString()
  semester: string;

  @IsString()
  gradingPeriod: string;

  @IsEnum(GradeLockStatus)
  gradeLockStatus: GradeLockStatus;

  @IsOptional()
  @IsString()
  gradeLockDate?: string;
}
