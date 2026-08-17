// backend/src/modules/academic-calendar/dto/program-calendar.dto.ts

import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Break ─────────────────────────────────────────────────────────────────────

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

// ── Holiday Config (org-global — no schoolYearId) ─────────────────────────────

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
  // No schoolYearId — config is org-global

  @IsArray()
  @IsString({ each: true })
  enabledKeys!: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomHolidayDto)
  customHolidays?: CustomHolidayDto[];
}
