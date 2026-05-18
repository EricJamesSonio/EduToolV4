import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateGuideStepDto {
  @IsInt()
  order_index!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  text!: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
