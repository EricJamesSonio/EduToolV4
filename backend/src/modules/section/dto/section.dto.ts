// @/modules/section/dto/section.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

// ── POST /sections ────────────────────────────────────────────────────────────

export class CreateSectionDto {
  @IsUUID()
  levelId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;
}

// ── PATCH /sections/:id ───────────────────────────────────────────────────────

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

// ── GET /sections ─────────────────────────────────────────────────────────────

export class QuerySectionDto {
  @IsOptional()
  @IsUUID()
  levelId?: string;
}