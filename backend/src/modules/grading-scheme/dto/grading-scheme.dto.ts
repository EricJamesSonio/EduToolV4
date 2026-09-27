import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentType } from '../constants/assessment-type.constants';

// Re-exported so existing importers
// (`grading-scheme-template` DTO/entity, org-seeder data) keep working.
// The values are declared once in `constants/assessment-type.constants.ts`.
export { ComponentType };

export class GradingSchemeComponentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsEnum(ComponentType)
  type!: ComponentType;

  @IsNumber()
  @Min(1)
  @Max(100)
  weight!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class CreateGradingSchemeDto {
  @IsUUID()
  classId!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeComponentDto)
  components!: GradingSchemeComponentDto[];
}

export class UpdateGradingSchemeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeComponentDto)
  components?: GradingSchemeComponentDto[];
}

export class ApplyTemplateToClassDto {
  @IsUUID()
  classId!: string;

  @IsUUID()
  templateId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class ApplyTemplateToProgramDto {
  @IsUUID()
  programId!: string;

  @IsUUID()
  templateId!: string;
}
