// src/modules/auth/dto/admin-request.dto.ts
import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { IsGmailAddress } from '@/commons/validators/is-gmail-address.validator';

export class SendAdminRequestOtpDto {
  @IsGmailAddress()
  email!: string;
}

export class VerifyAdminRequestOtpDto {
  @IsGmailAddress()
  email!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}

export class SubmitAdminRequestDto {
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  institution_name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  student_count?: string;

  @IsOptional()
  @IsString()
  programs_departments?: string;
}
