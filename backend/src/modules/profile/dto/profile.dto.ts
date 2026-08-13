import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { IsGmailAddress } from '@/commons/validators/is-gmail-address.validator'

export class UpdatePersonalEmailDto {
  @IsOptional()
  @IsEmail({}, { message: 'personalEmail must be a valid email address' })
  personalEmail?: string | null
}

export class ChangePersonalEmailRequestDto {
  @IsGmailAddress()
  newEmail!: string
}

export class ChangePersonalEmailVerifyDto {
  @IsGmailAddress()
  newEmail!: string

  @IsString()
  @IsNotEmpty({ message: 'code must not be empty' })
  code!: string
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'fullName must be at most 200 characters' })
  fullName?: string

  @IsOptional()
  @IsEmail({}, { message: 'personalEmail must be a valid email address' })
  personalEmail?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'profileImage must be at most 500 characters' })
  profileImage?: string
}