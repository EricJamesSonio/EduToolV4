// src/modules/concern/dto/concern.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConcernStatus } from '@prisma/client';

export class CreateConcernDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}

export class ReplyConcernDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

export class QueryConcernDto {
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

export class QueryStaffConcernDto {
  @IsOptional()
  @IsEnum(ConcernStatus)
  status?: ConcernStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(student|admin|educator)$/)
  senderRole?: string;

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

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}