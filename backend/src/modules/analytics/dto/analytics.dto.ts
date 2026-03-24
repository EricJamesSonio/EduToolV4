// src/modules/analytics/dto/analytics.dto.ts
import { IsOptional, IsUUID } from 'class-validator';

export class GradeAnalyticsQueryDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;
}