import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolYearEnrollmentStatus } from '@prisma/client'; // updated to use prisma types

// ── School-Year Enrollment ──────────────────────────────────────────────────

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
  @IsEnum(SchoolYearEnrollmentStatus)
  status!: SchoolYearEnrollmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Program Enrollment ──────────────────────────────────────────────────────

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