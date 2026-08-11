import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class ApproveRequestDto {
  // Intentionally empty; the login email is derived from the request's Gmail
  // via generateAdminLoginEmail(), not supplied by the reviewer.
}

export class RejectRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RequestRevisionDto {
  @IsNotEmpty()
  fieldNotes!: Record<string, string>;
}