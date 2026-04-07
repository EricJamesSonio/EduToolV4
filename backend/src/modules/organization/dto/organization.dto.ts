// backend/src/modules/organization/dto/organization.dto.ts
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
  IsBoolean,
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

  /**
   * Custom level names per program.
   * Key = programKey, value = ordered array of level name strings.
   * e.g. { college: ['1st Year', '2nd Year'], shs: ['Grade 11', 'Grade 12'] }
   */
  @IsOptional()
  @IsObject()
  levelConfigs?: Record<string, string[]>

  /**
   * Per-program grading scale to seed.
   * Key = programKey, value = scale definition.
   */
  @IsOptional()
  @IsObject()
  gradingScales?: Record<string, GradingScalePayloadDto>
}