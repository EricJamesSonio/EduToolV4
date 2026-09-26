// backend/src/modules/school-year/dto/school-year.dto.ts

import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  confirm_short_duration?: boolean;
}
export class UpdateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  confirm_short_duration?: boolean;
}

export interface SchoolYearCreateResult {
  data: unknown; // tighten to SchoolYearEntity if you import it here
  warning?: string;
  /**
   * True when the org's "auto-seed new school years" setting is on AND a
   * School Profile with at least one configured department existed, so this
   * school year was seeded automatically. False means the frontend should
   * offer to seed it (org setting off, or nothing configured to seed yet).
   */
  seeded?: boolean;
}