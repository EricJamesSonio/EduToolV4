import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradeRangeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercent: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercent: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  gradeValue: string; // e.g. "1.0", "A", "Excellent"

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  remark: string; // e.g. "Passed", "Failed", "Incomplete"

  @IsBoolean()
  isPassing: boolean;
}

export class CreateGradingScaleDto {
  @IsUUID()
  programId: string; // CHANGED from levelId → programId

  @IsUUID()
  schoolYearId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges: GradeRangeDto[];
}

export class UpdateGradingScaleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges?: GradeRangeDto[];
}

export class QueryGradingScaleDto {
  @IsOptional()
  @IsUUID()
  programId?: string; // CHANGED from levelId → programId

  @IsOptional()
  @IsUUID()
  schoolYearId?: string;
}