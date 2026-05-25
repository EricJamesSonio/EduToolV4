import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateGuideStepDto {
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
