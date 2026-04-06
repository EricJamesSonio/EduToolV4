import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  Matches,
} from 'class-validator'

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

  @IsOptional()
  @IsString()
  @Matches(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'emailExtension must be a valid domain like @edutool.ph',
  })
  emailExtension?: string | null
}

export class SeedOrganizationDto {
  @IsUUID()
  schoolYearId!: string

  @IsArray()
  @IsString({ each: true })
  programs!: string[]

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