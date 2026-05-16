// backend/src/modules/academic-calendar/dto/program-calendar.dto.ts

import {
  IsString, IsOptional, IsUUID, IsDateString,
  IsArray, ValidateNested, IsInt, Min, MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Break DTO ─────────────────────────────────────────────────────────────────

export class BreakDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

// ── POST /program-calendars ───────────────────────────────────────────────────

export class CreateProgramCalendarDto {
  @IsUUID()
  schoolYearId!: string;

  @IsUUID()
  programId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakDto)
  breaks?: BreakDto[];
}

// ── PATCH /program-calendars/:id ──────────────────────────────────────────────

export class UpdateProgramCalendarDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /**
   * Full replacement of breaks — send the complete desired list.
   * Service will delete existing and recreate.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakDto)
  breaks?: BreakDto[];
}

// ── Query ─────────────────────────────────────────────────────────────────────

export class QueryProgramCalendarDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;
}

// ── Holiday Config ────────────────────────────────────────────────────────────

export class CustomHolidayDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class SaveHolidayConfigDto {
  @IsUUID()
  schoolYearId!: string;

  /** Keys from PHILIPPINE_HOLIDAYS seed list that should be enabled */
  @IsArray()
  @IsString({ each: true })
  enabledKeys!: string[];

  /** Admin-added holidays not in the seed list */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomHolidayDto)
  customHolidays?: CustomHolidayDto[];
}

export class SeedHolidaysToCalendarDto {
  @IsUUID()
  schoolYearId!: string;

  /** Year to use when computing holiday dates (e.g. 2026) */
  @IsInt()
  @Min(2000)
  year!: number;
}