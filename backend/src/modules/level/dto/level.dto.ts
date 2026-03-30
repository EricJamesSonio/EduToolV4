// @/modules/level/dto/level.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Single level item inside a defaults payload ───────────────────────────────

export class LevelItemDto {
  @IsOptional()
  @IsUUID()
  id?: string; // present when updating an existing level row

  @IsUUID()
  programId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

// ── PATCH /levels/defaults ────────────────────────────────────────────────────

/**
 * Admin replaces or adds level entries in the org's default template.
 * The full desired list is sent; the service diffs and upserts.
 */
export class UpdateLevelDefaultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelItemDto)
  levels: LevelItemDto[];
}

export class CreateLevelDto {
  @IsUUID()
  programId: string;

  @IsUUID()
  schoolYearId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

// ── PATCH /levels/:id ─────────────────────────────────────────────────────────

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}

// ── GET /levels?schoolYearId= ─────────────────────────────────────────────────

export class QueryLevelDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;
}