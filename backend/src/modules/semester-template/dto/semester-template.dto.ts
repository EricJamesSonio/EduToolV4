import { IsString, IsArray, IsOptional, IsUUID, MinLength, MaxLength, IsInt, Min, ValidateNested, ArrayMinSize, IsIn, } from 'class-validator'
import { Type } from 'class-transformer'

export type ProgramType = 'daycare' | 'kinder' | 'elementary' | 'jhs' | 'shs' | 'college' | 'custom'

export class CreateSemesterTemplateTermDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string
  @IsInt() @Min(1) orderIndex!: number
}

export class CreateSemesterTemplateItemDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string
  @IsInt() @Min(1) orderIndex!: number
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateSemesterTemplateTermDto)
  terms!: CreateSemesterTemplateTermDto[]
}

export class CreateSemesterTemplateDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string
  @IsIn(['college', 'shs', 'jhs', 'elementary', 'kinder', 'daycare', 'custom'])
programType!: ProgramType
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateSemesterTemplateItemDto)
  semesters!: CreateSemesterTemplateItemDto[]
}

export class UpdateSemesterTemplateDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) name?: string
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateSemesterTemplateItemDto)
  semesters?: CreateSemesterTemplateItemDto[]
}

export class AssignTemplateDto {
  @IsUUID() programId!: string
  @IsUUID() templateId!: string
}