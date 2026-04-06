import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  IsIn,
  IsUUID,   // ← added
} from 'class-validator'

const VALID_PROGRAM_KEYS = ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college']

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}

export class SeedOrganizationDto {
  @IsUUID()
  schoolYearId: string

  @IsArray()
  @IsString({ each: true })
  programs: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courses?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strands?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedLevels?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedSubjects?: string[]
}