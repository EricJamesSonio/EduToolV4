import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { SchoolYearEnrollmentStatus } from '@prisma/client';

export class GradeAnalyticsQueryDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsEnum(SchoolYearEnrollmentStatus)
  status?: SchoolYearEnrollmentStatus;
}
