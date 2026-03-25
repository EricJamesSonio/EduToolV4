// src/modules/attendance/dto/attendance.dto.ts
import {
  IsEnum,
  IsArray,
  IsString,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export class AttendanceRecordEntryDto {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class BulkSetAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordEntryDto)
  records: AttendanceRecordEntryDto[];
}

export class UpdateAttendanceRecordDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class GetSessionsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  weekNumber?: number;
}