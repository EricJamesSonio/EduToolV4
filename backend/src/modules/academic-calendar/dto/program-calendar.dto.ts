// backend/src/modules/academic-calendar/dto/program-calendar.dto.ts

import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCalendarDate } from '@/commons/utils/datetime.util';

// ── Break ─────────────────────────────────────────────────────────────────────

export class BreakDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsCalendarDate()
  startDate!: string;

  @IsCalendarDate()
  endDate!: string;
}

// ── POST /program-calendars ───────────────────────────────────────────────────

export class CreateProgramCalendarDto {
  @IsUUID()
  schoolYearId!: string;

  @IsUUID()
  programId!: string;

  @IsCalendarDate()
  startDate!: string;

  @IsCalendarDate()
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
  @IsCalendarDate()
  startDate?: string;

  @IsOptional()
  @IsCalendarDate()
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

  @IsCalendarDate()
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
