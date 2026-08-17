// backend/src/modules/school-year/dto/school-year.dto.ts

import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateSchoolYearDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  confirm_short_duration?: boolean;
}

export class UpdateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  confirm_short_duration?: boolean;
}

export interface SchoolYearCreateResult {
  data: unknown; // tighten to SchoolYearEntity if you import it here
  warning?: string;
}
