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
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
