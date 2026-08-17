// @/modules/registrar/dto/registrar.dto.ts
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RegistrarStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// ── POST /registrars ──────────────────────────────────────────────────────────

export class CreateRegistrarDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}

// ── GET /registrars ───────────────────────────────────────────────────────────

export class QueryRegistrarDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RegistrarStatus)
  status?: RegistrarStatus;

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

// ── PATCH /registrars/:id/status ──────────────────────────────────────────────

export class UpdateRegistrarStatusDto {
  @IsEnum(RegistrarStatus)
  status!: RegistrarStatus;
}
