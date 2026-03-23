// src/modules/subject/dto/subject.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

// ── POST /subjects ────────────────────────────────────────────────────────────

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsUUID()
  levelId: string;

  @IsOptional()
  @IsUUID()
  educatorId?: string;
}

// ── PATCH /subjects/:id ───────────────────────────────────────────────────────

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  educatorId?: string;
}

// ── GET /subjects ─────────────────────────────────────────────────────────────

export class QuerySubjectDto {
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  educatorId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}