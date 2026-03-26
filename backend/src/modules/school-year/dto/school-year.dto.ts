// @/modules/school-year/dto/school-year.dto.ts
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

// ── POST /school-years ────────────────────────────────────────────────────────

export class CreateSchoolYearDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

// ── PATCH /school-years/:id ───────────────────────────────────────────────────

/**
 * Only the name is editable directly.
 * Status transitions happen via dedicated endpoints (activate / end).
 */
export class UpdateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}