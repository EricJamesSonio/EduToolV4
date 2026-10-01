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
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class GenerateClassesDto {
  @IsUUID()
  schoolYearId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one department.' })
  @IsUUID('4', { each: true })
  programIds!: string[];

  @IsUUID()
  semesterId!: string;

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
  @IsUUID('4', { each: true })
  programIds!: string[];
}