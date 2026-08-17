import { IsString } from 'class-validator';

export class LoginPlatformDto {
  @IsString()
  password: string;
}
