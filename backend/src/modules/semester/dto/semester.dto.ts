// @/modules/semester/dto/semester.dto.ts
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Term DTO (nested inside semester) ────────────────────────────────────────

export class CreateTermDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string; // e.g. Prelim, Midterm, Pre-Finals, Finals

  @IsInt()
  @Min(1)
  orderIndex: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateTermDto {
  @IsOptional()
  @IsUUID()
  id?: string; // present for existing terms, absent for new ones

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderIndex?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ── POST /semester-settings ───────────────────────────────────────────────────

export class CreateSemesterDto {
  @IsUUID()
  schoolYearId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string; // e.g. "1st Semester", "2nd Semester"

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTermDto)
  terms: CreateTermDto[];
}

// ── PATCH /semester-settings/:id ─────────────────────────────────────────────

export class UpdateSemesterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Full list of terms for this semester.
   * Terms with an id are updated; without an id are created.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateTermDto)
  terms?: UpdateTermDto[];
}
