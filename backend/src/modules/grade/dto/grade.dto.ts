// src/modules/grade/dto/grade.dto.ts
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
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