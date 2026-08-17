import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export enum ProgramType {
  DAYCARE = 'daycare',
  KINDER = 'kinder',
  ELEMENTARY = 'elementary',
  JHS = 'jhs',
  SHS = 'shs',
  COLLEGE = 'college',
  CUSTOM = 'custom',
}

export class CreateProgramDto {
  @IsUUID()
  schoolYearId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;
}
