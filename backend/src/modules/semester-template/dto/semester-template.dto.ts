// backend/src/modules/semester-template/dto/semester-template.dto.ts

import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// Mirrors backend ProgramType enum exactly
export type ProgramType =
  | 'daycare'
  | 'kinder'
  | 'elementary'
  | 'jhs'
  | 'shs'
  | 'college'
  | 'custom';

export class CreateSemesterTemplateTermDto {
  @IsString() @MinLength(1) @MaxLength(100)
  name!: string;

  @IsInt() @Min(1)
  orderIndex!: number;
}

export class CreateSemesterTemplateItemDto {
  @IsString() @MinLength(1) @MaxLength(100)
  name!: string;

  @IsInt() @Min(1)
  orderIndex!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSemesterTemplateTermDto)
  terms!: CreateSemesterTemplateTermDto[];
}

export class CreateSemesterTemplateDto {
  @IsString() @MinLength(1) @MaxLength(100)
  name!: string;

  @IsIn(['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college', 'custom'])
  programType!: ProgramType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSemesterTemplateItemDto)
  semesters!: CreateSemesterTemplateItemDto[];
}

export class UpdateSemesterTemplateDto {
  @IsOptional()
  @IsString() @MinLength(1) @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSemesterTemplateItemDto)
  semesters?: CreateSemesterTemplateItemDto[];
}

export class TermDateDto {
  @IsUUID()
  termId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class AssignTemplateDto {
  @IsUUID()
  programId!: string;

  @IsUUID()
  templateId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermDateDto)
  termDates?: TermDateDto[];
}