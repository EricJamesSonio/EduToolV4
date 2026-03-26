// @/modules/grading-scale/dto/grading-scale.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Grade range item ──────────────────────────────────────────────────────────

export class GradeRangeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercent: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercent: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  gradeValue: string; // e.g. "1.0", "A", "Excellent"

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  remark: string; // e.g. "Passed", "Failed", "Incomplete"

  @IsBoolean()
  isPassing: boolean;
}

// ── POST /grading-scales ──────────────────────────────────────────────────────

export class CreateGradingScaleDto {
  @IsUUID()
  levelId: string;

  @IsUUID()
  schoolYearId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges: GradeRangeDto[];
}

// ── PATCH /grading-scales/:id ─────────────────────────────────────────────────

export class UpdateGradingScaleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges?: GradeRangeDto[];
}

// ── GET /grading-scales ───────────────────────────────────────────────────────

export class QueryGradingScaleDto {
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  schoolYearId?: string;
}