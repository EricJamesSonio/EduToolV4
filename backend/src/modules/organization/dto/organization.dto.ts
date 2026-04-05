import { IsString, IsOptional, MinLength, MaxLength, IsArray, IsIn } from 'class-validator';

const VALID_PROGRAM_KEYS = ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college'];

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;        // ← add !

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsIn(VALID_PROGRAM_KEYS, { each: true })
  programs?: string[];
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}