// @/modules/educator/dto/educator.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum EducatorStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// ── POST /educators ───────────────────────────────────────────────────────────

export class CreateEducatorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Username must be alphanumeric only.' })
  emailName?: string;
}

// ── PATCH /educators/:id ──────────────────────────────────────────────────────

export class UpdateEducatorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Username must be alphanumeric only.' })
  emailName?: string;

  @IsOptional()
  @IsEmail({ require_tld: false })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  educatorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;
}
// ── PATCH /educators/:id/status ────────────────────────────────────────────────

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

// ── POST /educators/bulk ───────────────────────────────────────────────────────

export class BulkCreateEducatorDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkEducatorEntry)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  entries: BulkEducatorEntry[];
}

export class BulkEducatorEntry {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  id!: string;
}
