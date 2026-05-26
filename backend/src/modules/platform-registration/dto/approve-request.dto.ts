import { IsOptional, IsEmail, IsString } from 'class-validator';

export class ApproveRequestDto {
  @IsOptional()
  @IsEmail()
  adminEmail?: string;
}
