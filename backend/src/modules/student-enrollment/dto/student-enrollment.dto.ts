import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── School-Year Enrollment ────────────────────────── ────────────────────────

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  student_id!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkEnrollStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollStudentDto)
  students!: EnrollStudentDto[];
}

export class UpdateSchoolYearEnrollmentDto {
  @IsEnum(["active", "pending", "unenrolled"] as const)
  status!: SchoolYearEnrollmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Program Enrollment ──────────────────────────────────────────────────────
export type SchoolYearEnrollmentStatus =
  | "active"
  | "pending"
  | "unenrolled";

export type ProgramEnrollmentStatus = "active" | "pending" | "removed";

export interface ProgramEnrollmentSnapshot {
  id:         string;
  program_id: string;
  program:    { id: string; name: string; type: string };
  level:      { id: string; name: string } | null;
  course:     { id: string; name: string; code: string | null } | null;
  strand:     { id: string; name: string } | null;
  section:    { id: string; name: string } | null;
  status:     ProgramEnrollmentStatus;
  enrolled_at: string;
}

export interface StudentSchoolYearEnrollment {
  id:             string;
  org_id:         string;
  student_id:     string;
  school_year_id: string;
  status:         SchoolYearEnrollmentStatus;
  enrolled_at:    string;
  unenrolled_at:  string | null;
  notes:          string | null;
  programEnrollments: ProgramEnrollmentSnapshot[];
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface EnrollStudentRequest {
  student_id: string;
  notes?:     string;
}

export interface BulkEnrollStudentsRequest {
  students: EnrollStudentRequest[];
}

export interface UpdateSchoolYearEnrollmentRequest {
  status: SchoolYearEnrollmentStatus;
  notes?: string;
}

export interface EnrollStudentProgramRequest {
  program_id:  string;
  level_id?:   string;
  course_id?:  string;
  strand_id?:  string;
  section_id?: string;
}

export interface UpdateProgramEnrollmentRequest {
  level_id?:   string | null;
  course_id?:  string | null;
  strand_id?:  string | null;
  section_id?: string | null;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface BulkEnrollResult {
  enrolled: string[];
  failed:   { student_id: string; reason: string }[];
}
export class EnrollStudentProgramDto {
  @IsString()
  @IsNotEmpty()
  program_id!: string;

  @IsOptional()
  @IsString()
  level_id?: string;

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  strand_id?: string;

  @IsOptional()
  @IsString()
  section_id?: string;
}

export class UpdateProgramEnrollmentDto {
  @IsOptional()
  @IsString()
  level_id?: string;

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  strand_id?: string;

  @IsOptional()
  @IsString()
  section_id?: string;
}

export class PaginatedEnrollmentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export interface PaginatedResult<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}