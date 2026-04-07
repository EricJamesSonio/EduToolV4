import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
} from 'class-validator'

export class CreateSchoolYearDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsDateString()
  start_date?: string

  @IsOptional()
  @IsDateString()
  end_date?: string
}

export class UpdateSchoolYearDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsDateString()
  start_date?: string

  @IsOptional()
  @IsDateString()
  end_date?: string
}