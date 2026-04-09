import { IsEmail, IsOptional } from 'class-validator'

export class UpdatePersonalEmailDto {
  @IsOptional()
  @IsEmail({}, { message: 'personalEmail must be a valid email address' })
  personalEmail?: string | null
}