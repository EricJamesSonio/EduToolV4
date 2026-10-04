import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class GenerateClassesDto {
  @IsUUID()
  schoolYearId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one department.' })
  // Any UUID version: seeded rows use deterministic v5 ids.
  @IsUUID(undefined, { each: true })
  programIds!: string[];

  @IsUUID()
  semesterId!: string;

  /**
   * Optional subset of sections to generate for. Omit or empty = every
   * section in the selected departments (previous behavior). Ids that do not
   * belong to the scope simply match nothing.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  // Any UUID version (see programIds above).
  @IsUUID(undefined, { each: true })
  sectionIds?: string[];

  /** Optional narrowing of the daily window; defaults to the org window. */
  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'windowStart must be HH:MM' })
  windowStart?: string;

  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'windowEnd must be HH:MM' })
  windowEnd?: string;

  /** Safety cap so one run cannot flood the org. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  maxItems?: number;
}

export class CommitGenerateDto extends GenerateClassesDto {
  /**
   * The admin must confirm they reviewed the preview. Without it, commit is a
   * one-click action that silently writes dozens of classes.
   */
  @IsBoolean()
  confirmed!: boolean;
}

export class GenerateReadinessDto {
  @IsUUID()
  schoolYearId!: string;

  @IsArray()
  @ArrayMinSize(1)
  // Any UUID version (see GenerateClassesDto).
  @IsUUID(undefined, { each: true })
  programIds!: string[];
}

export class GeneratorRosterQueryDto {
  @IsUUID()
  schoolYearId!: string;
}