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
  minPercent!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercent!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  gradeValue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  remark!: string;

  @IsBoolean()
  isPassing!: boolean;
}

export class CreateGradingScaleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  programType!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRangeDto)
  ranges!: GradeRangeDto[];
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

export class AssignGradingScaleDto {
  @IsUUID()
  scaleId!: string;

  @IsUUID()
  schoolYearId!: string;
}

export class QueryGradingScaleDto {
  @IsOptional()
  @IsString()
  programType?: string;
}
