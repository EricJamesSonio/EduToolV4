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

  /**
   * A Semester belongs to exactly one program — its dates and terms are
   * that program's own calendar, not something shared across departments.
   */
  @IsUUID()
  programId: string;

  /**
   * Which slot in the program's assigned SemesterTemplate this Semester
   * fulfills (e.g. the template's "1st Semester" item for a regular 2-sem
   * program, or one of three items for a tri-sem program). This — not
   * `name` — is what resolution/lookup uses going forward.
   */
  @IsUUID()
  templateSemesterId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string; // display label only, e.g. "1st Semester" — pre-filled from the template slot's own name, editable

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
  // programId / templateSemesterId are identity fields set at creation and
  // are not editable afterward — changing which program/slot a Semester
  // fulfills means creating a new one, not patching this one.

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