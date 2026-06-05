// @/modules/educator/dto/educator.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  emailName: string;
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
  fullName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  id: string;
}
