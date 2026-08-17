// src/modules/grade/educator/dto/grade-educator.dto.ts
import {
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';
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

// POST /classes/:classId/grades/students/:studentId/assessments/:assessmentId/override
export class SetAssessmentStatusOverrideDto {
  // Only these two are educator-overridable; PENDING/SUBMITTED are
  // system-driven states and must never be accepted here.
  @IsIn(['EXEMPTED', 'MISSING'])
  overrideStatus: 'EXEMPTED' | 'MISSING';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}