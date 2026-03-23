// src/modules/rubric/dto/rubric.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RubricCategoryType {
  ASSESSMENT_LINKED = 'assessment_linked',
  MANUAL_ENTRY = 'manual_entry',
}

export enum AssessmentType {
  QUIZ = 'quiz',
  ACTIVITY = 'activity',
  EXAM = 'exam',
  CUSTOM = 'custom',
}

// ── Rubric category item ──────────────────────────────────────────────────────

export class RubricCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(RubricCategoryType)
  type: RubricCategoryType;

  @IsNumber()
  @Min(1)
  @Max(100)
  weight: number;

  /**
   * Only relevant for assessment_linked categories.
   * Specifies which assessment types feed into this category.
   */
  @IsOptional()
  @IsArray()
  @IsEnum(AssessmentType, { each: true })
  assessmentTypes?: AssessmentType[];
}

// ── PATCH /rubrics/default ────────────────────────────────────────────────────

export class UpdateDefaultRubricDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCategoryDto)
  categories?: RubricCategoryDto[];
}

// ── POST /rubrics (educator personal library) ─────────────────────────────────

export class CreateRubricDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCategoryDto)
  categories: RubricCategoryDto[];
}

// ── PATCH /rubrics/:id ────────────────────────────────────────────────────────

export class UpdateRubricDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCategoryDto)
  categories?: RubricCategoryDto[];
}