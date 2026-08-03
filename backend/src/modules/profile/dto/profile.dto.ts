import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdatePersonalEmailDto {
  @IsOptional()
  @IsEmail({}, { message: 'personalEmail must be a valid email address' })
  personalEmail?: string | null
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