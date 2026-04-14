import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum StudentStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DROPPED = 'dropped',
  TRANSFERRED = 'transferred',
  SUSPENDED = 'suspended',
  GRADUATED = 'graduated',
}

export class CreateStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  studentId!: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

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

export class UpdateStudentStatusDto {
  @IsEnum(StudentStatus)
  status!: StudentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class QueryStudentDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  // ── Hierarchy filters ────────────────────────────────────────────────────

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  programId?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  strandId?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsUUID()
  sectionId?: string;
}

export class AddEnrollmentDto {
  @IsUUID()
  classId!: string;
}