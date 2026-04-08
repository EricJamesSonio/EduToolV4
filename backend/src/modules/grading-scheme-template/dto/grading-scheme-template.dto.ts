// filepath: src/modules/grading-scheme-template/dto/grading-scheme-template.dto.ts

import {
  IsString, IsOptional, IsNumber, IsArray, IsEnum,
  ValidateNested, MinLength, MaxLength, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentType } from '@/modules/grading-scheme/dto/grading-scheme.dto';

export class GradingSchemeTemplateComponentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(ComponentType)
  type: ComponentType;

  @IsNumber()
  @Min(1)
  @Max(100)
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;
}

export class CreateGradingSchemeTemplateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  programType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeTemplateComponentDto)
  components: GradingSchemeTemplateComponentDto[];
}

export class UpdateGradingSchemeTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  programType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeTemplateComponentDto)
  components?: GradingSchemeTemplateComponentDto[];
}