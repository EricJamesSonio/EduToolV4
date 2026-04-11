// backend/src/modules/class/dto/class.dto.ts

import {
  IsString, IsUUID, IsInt, IsOptional, IsBoolean,
  IsArray, ArrayNotEmpty, IsIn, Min, Max,
  ValidateNested, MinLength, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSlotDto {
  @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class CreateClassDto {
  @IsUUID()
  subjectId!: string;

  @IsUUID()
  educatorId!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsUUID()
  schoolYearId!: string;

  // Removed semesterId — resolved automatically from schoolYearId in service

  @IsInt()
  @Min(0)
  capacity!: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules!: ScheduleSlotDto[];
}

export class UpdateClassDto {
  @IsOptional() @IsUUID()
  educatorId?: string;

  @IsOptional() @IsUUID()
  sectionId?: string;

  @IsOptional() @IsInt() @Min(0)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules?: ScheduleSlotDto[];
}

export class QueryClassDto {
  @IsOptional() @IsUUID() schoolYearId?: string;
  @IsOptional() @IsUUID() semesterId?:   string;
  @IsOptional() @IsUUID() educatorId?:   string;
  @IsOptional() @IsUUID() subjectId?:    string;
  @IsOptional() @IsUUID() sectionId?:    string;
}

export class EnrollStudentDto {
  @IsUUID()
  studentId!: string;
}

export class UpdateEnrollmentDto {
  @IsIn(['active', 'pending', 'removed'])
  status!: 'active' | 'pending' | 'removed';
}

export class ReassignEducatorDto {
  @IsUUID()
  educatorId!: string;

  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}