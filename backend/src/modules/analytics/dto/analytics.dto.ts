import { IsOptional, IsEnum, IsUUID, Matches } from 'class-validator';
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

export class AnalyticsRangeQueryDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}