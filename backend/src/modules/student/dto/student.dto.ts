// @/modules/student/dto/student.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

// ── Status enum ───────────────────────────────────────────────────────────────

export enum StudentStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DROPPED = 'dropped',
  TRANSFERRED = 'transferred',
  SUSPENDED = 'suspended',
  GRADUATED = 'graduated',
}

// ── POST /students ────────────────────────────────────────────────────────────

export class CreateStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  studentId: string; // Admin-assigned student ID

  @IsUUID()
  levelId: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string; // optional — if absent, student starts as pending
}

// ── PATCH /students/:id ───────────────────────────────────────────────────────

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

// ── PATCH /students/:id/status ────────────────────────────────────────────────

export class UpdateStudentStatusDto {
  @IsEnum(StudentStatus)
  status: StudentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string; // required for irreversible transitions (dropped/transferred/graduated)
}

// ── GET /students ─────────────────────────────────────────────────────────────

export class QueryStudentDto {
  @IsOptional()
  @IsString()
  search?: string; // by name or studentId

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}