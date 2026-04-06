import {
  IsString, IsOptional, IsInt, IsUUID, MinLength, MaxLength, Min,
} from 'class-validator';

export class CreateSectionDto {
  @IsUUID()
  levelId!: string;

  @IsUUID()
  schoolYearId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class QuerySectionDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;
}