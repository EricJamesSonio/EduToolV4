// src/modules/academic-calendar/dto/academic-calendar.dto.ts
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum CalendarEventType {
  HOLIDAY = 'holiday',
  NO_CLASS_DAY = 'no_class_day',
  EXAM_WEEK = 'exam_week',
  SPECIAL_EVENT = 'special_event',
}

// ── POST /academic-calendar ───────────────────────────────────────────────────

export class CreateCalendarEventDto {
  @IsUUID()
  schoolYearId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsEnum(CalendarEventType)
  type: CalendarEventType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// ── PATCH /academic-calendar/:id ─────────────────────────────────────────────

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// ── GET /academic-calendar?schoolYearId= ─────────────────────────────────────

export class QueryCalendarEventDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;
}