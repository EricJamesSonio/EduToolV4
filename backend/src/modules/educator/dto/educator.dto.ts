// @/modules/educator/dto/educator.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum EducatorStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// ── POST /educators ───────────────────────────────────────────────────────────

export class CreateEducatorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsEmail()
  email: string;
}

// ── PATCH /educators/:id ──────────────────────────────────────────────────────

export class UpdateEducatorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateEducatorStatusDto {
  @IsEnum(EducatorStatus)
  status!: EducatorStatus;
}

// ── GET /educators ────────────────────────────────────────────────────────────

export class QueryEducatorDto {
  @IsOptional()
  @IsString()
  search?: string; // search by name or educatorId

  @IsOptional()
  @IsEnum(EducatorStatus)
  status?: EducatorStatus;
}
