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
  id?: string;

  @IsUUID()
  programId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdateLevelDefaultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelItemDto)
  levels!: LevelItemDto[];
}

/**
 * DTO for creating a new level.
 * `count` is the level's position (1, 2, 3…) within its department/course/strand
 * scope — the label ("Grade 3", "2nd Year", …) is always derived server-side
 * from the program's type, never typed by the user.
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

  @IsInt()
  @Min(1)
  @Max(20)
  count!: number;
}

/**
 * DTO for "renaming" a level — in practice, setting it to a different number.
 * The label is re-derived from the program's type + this count.
 */
export class UpdateLevelDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}

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
  scoped?: string;
}

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