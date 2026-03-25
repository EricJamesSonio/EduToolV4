// src/modules/class/dto/class.dto.ts
import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  Min,
  Max,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Nested: schedule slot ─────────────────────────────────────────────────────

export class ScheduleSlotDto {
  @IsInt()
  @Min(0)
  @Max(6) // 0 = Sunday ... 6 = Saturday
  weekday: number;

  @IsString()
  startTime: string; // HH:mm format

  @IsString()
  endTime: string; // HH:mm format
}

// ── POST /classes ─────────────────────────────────────────────────────────────

export class CreateClassDto {
  @IsUUID()
  subjectId: string;

  @IsUUID()
  educatorId: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsUUID()
  schoolYearId: string;

  @IsUUID()
  semesterId: string;

  @IsInt()
  @Min(0) // 0 = unlimited
  capacity: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules: ScheduleSlotDto[];
}

// ── PATCH /classes/:id ────────────────────────────────────────────────────────

export class UpdateClassDto {
  @IsOptional()
  @IsUUID()
  educatorId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules?: ScheduleSlotDto[];
}

// ── GET /classes ──────────────────────────────────────────────────────────────

export class QueryClassDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  semesterId?: string;

  @IsOptional()
  @IsUUID()
  educatorId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

// ── POST /classes/:id/enroll ──────────────────────────────────────────────────

export class EnrollStudentDto {
  @IsUUID()
  studentId: string;
}

// ── PATCH /classes/:classId/enrollments/:enrollmentId ────────────────────────

export class UpdateEnrollmentDto {
  @IsIn(['active', 'pending', 'removed'])
  status: 'active' | 'pending' | 'removed';
}

// ── POST /classes/:id/reassign-educator ───────────────────────────────────────

export class ReassignEducatorDto {
  @IsUUID()
  educatorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}