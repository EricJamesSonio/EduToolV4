import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStrandDto {
  @IsUUID()
  schoolYearId: string;

  @IsUUID()
  program_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateStrandDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class StrandQueryDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  program_id?: string;
}
