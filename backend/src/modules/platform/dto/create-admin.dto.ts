import { IsEmail } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;
}