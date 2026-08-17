// filepath: backend/src/modules/org-seeder/dto/org-seed.dto.ts

import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class SectionItemDto {
  @IsString()
  name!: string

  @IsNumber()
  capacity!: number
}

class GradingScaleRangeDto {
  @IsString()
  label!: string

  @IsNumber()
  minScore!: number

  @IsNumber()
  maxScore!: number

  @IsString()
  gradeValue!: string
}

class GradingScaleOptionDto {
  @IsString()
  presetKey!: string

  @IsString()
  name!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingScaleRangeDto)
  ranges!: GradingScaleRangeDto[]
}

export class ProgramCalendarBreakSeedDto {
  @IsString()
  label!: string

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string
}

export class ProgramCalendarSeedDto {
  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCalendarBreakSeedDto)
  breaks?: ProgramCalendarBreakSeedDto[]
}

export class OrgSeedDto {
  @IsString()
  orgId!: string

  @IsString()
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
  sectionConfigs?: Record<string, SectionItemDto[]>

  @IsOptional()
  @IsObject()
  gradingScales?: Record<string, GradingScaleOptionDto>

  // NEW FLAGS
  @IsOptional()
  @IsBoolean()
  seedGradingSchemes?: boolean

  @IsOptional()
  @IsBoolean()
  seedSemesterTemplates?: boolean

  @IsOptional()
  @IsBoolean()
  seedProgramCalendars?: boolean

  @IsOptional()
  @IsObject()
  programCalendars?: Record<string, ProgramCalendarSeedDto>

  // new "other" field
  @IsObject()
  other!: Record<string, any>
}