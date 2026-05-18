import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateGuideStepDto {
  @IsInt()
  @IsOptional()
  order_index?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
