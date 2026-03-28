import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Mirrors GradingSchemeComponent.type values
// 'manual' = manually entered score (old manual_entry)
// everything else matches Assessment.type: 'quiz' | 'activity' | 'exam' | 'custom'
export enum ComponentType {
  QUIZ = 'quiz',
  ACTIVITY = 'activity',
  EXAM = 'exam',
  CUSTOM = 'custom',
  MANUAL = 'manual',
}

export class GradingSchemeComponentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(ComponentType)
  type: ComponentType;

  @IsNumber()
  @Min(1)
  @Max(100)
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_score?: number;

  @IsOptional()
  @IsBoolean()
  is_optional?: boolean;
}

// ── Create (educator personal library) ───────────────────────────────────────

export class CreateGradingSchemeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeComponentDto)
  components: GradingSchemeComponentDto[];
}

// ── Update (educator personal library) ───────────────────────────────────────

export class UpdateGradingSchemeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeComponentDto)
  components?: GradingSchemeComponentDto[];
}

// ── Update default (admin-managed org default) ────────────────────────────────

export class UpdateDefaultGradingSchemeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeComponentDto)
  components?: GradingSchemeComponentDto[];
}