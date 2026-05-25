import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateGuideDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
