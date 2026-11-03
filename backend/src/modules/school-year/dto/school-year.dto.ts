// backend/src/modules/school-year/dto/school-year.dto.ts

import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { IsCalendarDate } from '@/commons/utils/datetime.util';

export class CreateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  // TICK-INFRA-017: kind-B calendar dates — "YYYY-MM-DD" only.
  @IsOptional()
  @IsCalendarDate()
  start_date?: string;

  @IsOptional()
  @IsCalendarDate()
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

  // TICK-INFRA-017: kind-B calendar dates — "YYYY-MM-DD" only.
  @IsOptional()
  @IsCalendarDate()
  start_date?: string;

  @IsOptional()
  @IsCalendarDate()
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