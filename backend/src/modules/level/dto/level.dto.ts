import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LevelItemDto {
  @IsOptional()
  @IsUUID()
  id?: string; // present when updating an existing level row

  @IsUUID()
  programId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

/**
 * DTO for updating default levels
 */
export class UpdateLevelDefaultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelItemDto)
  levels!: LevelItemDto[];
}

/**
 * DTO for creating a new level
 */
export class CreateLevelDto {
  @IsUUID()
  programId!: string;

  @IsUUID()
  schoolYearId!: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

/**
 * DTO for updating a level
 */
export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}

/**
 * DTO for querying levels
 * Supports filtering by:
 * - schoolYearId (with optional courseId, strandId, or programId)
 */
export class QueryLevelDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsString()
  scoped?: string; // "program" to get only program-scoped (no course/strand), "all" for everything
}

/**
 * DTO for bulk generating levels
 */
export class BulkGenerateLevelsDto {
  @IsUUID()
  programId!: string;

  @IsUUID()
  schoolYearId!: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  count!: number;
}
