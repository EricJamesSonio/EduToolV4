// @/modules/program/dto/program.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum ProgramType {
  ELEMENTARY = 'elementary',
  HIGH_SCHOOL = 'high_school',
  SENIOR_HIGH = 'senior_high',
  COLLEGE = 'college',
  CUSTOM = 'custom',
}

// ── POST /programs ────────────────────────────────────────────────────────────

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(ProgramType)
  type: ProgramType;
}

// ── PATCH /programs/:id ───────────────────────────────────────────────────────

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(ProgramType)
  type?: ProgramType;
}