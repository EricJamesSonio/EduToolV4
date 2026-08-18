import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}
