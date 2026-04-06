import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty, IsUUID,
} from 'class-validator'

export enum ProgramType {
  ELEMENTARY  = 'elementary',
  HIGH_SCHOOL = 'high_school',
  SENIOR_HIGH = 'senior_high',
  COLLEGE     = 'college',
  CUSTOM      = 'custom',
}

export class CreateProgramDto {
  @IsUUID()
  schoolYearId: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  type: string
}


export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string
}