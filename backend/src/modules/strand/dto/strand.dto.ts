import { IsString, IsOptional, IsNotEmpty } from 'class-validator'

export class CreateStrandDto {
  @IsString()
  @IsNotEmpty()
  org_id: string

  @IsString()
  @IsNotEmpty()
  program_id: string

  @IsString()
  @IsNotEmpty()
  name: string
}

export class UpdateStrandDto {
  @IsString()
  @IsOptional()
  name?: string
}

export class StrandQueryDto {
  @IsString()
  @IsOptional()
  program_id?: string
}