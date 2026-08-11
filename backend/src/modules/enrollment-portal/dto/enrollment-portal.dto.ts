// src/modules/enrollment-portal/dto/enrollment-portal.dto.ts
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsGmailAddress } from '@/commons/validators/is-gmail-address.validator';

export class SendEnrollmentOtpDto {
  @IsEmail()
  @IsGmailAddress()
  email!: string;
}

export class VerifyEnrollmentOtpDto {
  @IsEmail()
  @IsGmailAddress()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class UpsertEnrollmentApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middle_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  last_school_graduated?: string;

  @IsString()
  @IsNotEmpty()
  program_id!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  course_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  strand_id?: string;

  @IsString()
  @IsNotEmpty()
  level_id!: string;
}

export class LookupEnrollmentApplicationQueryDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
