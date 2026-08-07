import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  emailName!: string;

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

  @IsOptional()
  @IsEmail()
  personalEmail?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;
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

  // ── Pagination ──────────────────────────────────────────────────────────

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

export class AddEnrollmentDto {
  @IsUUID()
  classId!: string;
}

// ── POST /students/bulk ────────────────────────────────────────────────────────

export class BulkCreateStudentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStudentEntry)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  entries: BulkStudentEntry[];
}

export class BulkStudentEntry {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  id: string;
}
