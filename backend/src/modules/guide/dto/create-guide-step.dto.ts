import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateGuideStepDto {
  @IsInt()
  orderIndex!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  content!: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
