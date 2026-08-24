import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PerClassOutcomeOverrideDto {
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  @IsEnum([
    'passed',
    'failed',
    'dropped',
    'withdrawn',
    'withdrawn_due_to_shifting',
    'transferred_credited',
    'completed',
  ] as const)
  outcome!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ShiftProgramDto {
  @IsString()
  @IsNotEmpty()
  toProgramId!: string;

  @IsString()
  @IsNotEmpty()
  levelId!: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  strandId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerClassOutcomeOverrideDto)
  perClassOutcomeOverrides?: PerClassOutcomeOverrideDto[];
}
