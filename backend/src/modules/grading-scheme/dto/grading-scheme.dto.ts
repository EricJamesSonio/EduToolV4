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
  maxScore?: number; // ✅ FIXED

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean; // ✅ FIXED
}

// ── Create ─────────────────────────────────────────

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

// ── Update ─────────────────────────────────────────

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

// ── Update Default ─────────────────────────────────

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