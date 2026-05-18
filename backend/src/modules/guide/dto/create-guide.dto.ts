import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum GuidePortalEnum {
  admin = 'admin',
  student = 'student',
  educator = 'educator',
}

export class CreateGuideDto {
  @IsEnum(GuidePortalEnum)
  portal!: GuidePortalEnum;

  @IsString()
  page_path!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
