import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsInstant } from '@/commons/utils/datetime.util';

export class CreateMeetingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  // TICK-INFRA-017: kind-A instant. Zone-less and date-only values rejected
  // with 400; the frontend sends UTC ISO (localInputToIso in ORG_TIMEZONE).
  @IsInstant()
  startTime: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  invitedStudentIds?: string[]; // empty = all enrolled students

  @IsOptional()
  @IsBoolean()
  ephemeral?: boolean;
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInstant()
  startTime?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  invitedStudentIds?: string[];
}

export class RespondJoinRequestDto {
  @IsString()
  status: 'accepted' | 'declined';
}
