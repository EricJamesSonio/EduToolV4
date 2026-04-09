import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  Matches,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  // ✅ FIXED: now truly optional
  @IsOptional()
  @IsString()
  @Matches(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'emailExtension must be a valid domain like @edutool.ph',
  })
  emailExtension?: string
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

  // ✅ FIXED: removed `| null`, handled in service instead
  @IsOptional()
  @IsString()
  @Matches(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'emailExtension must be a valid domain like @edutool.ph',
  })
  emailExtension?: string
}

export class GradingScaleRangeDto {
  @IsString()
  label!: string

  @IsNumber()
  minScore!: number

  @IsNumber()
  maxScore!: number

  @IsString()
  gradeValue!: string
}

export class GradingScalePayloadDto {
  @IsString()
  presetKey!: string

  @IsString()
  name!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingScaleRangeDto)
  ranges!: GradingScaleRangeDto[]
}

export class SectionItemDto {
  @IsString()
  name!: string

  @IsNumber()
  capacity!: number
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

  @IsOptional()
  @IsObject()
  levelConfigs?: Record<string, string[]>

  @IsOptional()
  @IsObject()
  gradingScales?: Record<string, GradingScalePayloadDto>

  @IsOptional()
  @IsObject()
  sectionConfigs?: Record<string, SectionItemDto[]>
}