// src/modules/grade/educator/dto/grade-educator.dto.ts
import { IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// PATCH /classes/:classId/grades/:termId/students/:studentId/manual
export class SetManualScoreDto {
  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score: number;
}

// PUT /classes/:classId/assessments/:assessmentId/grade-visibility
export class SetGradeVisibilityDto {
  @IsBoolean()
  showBreakdown: boolean;
}