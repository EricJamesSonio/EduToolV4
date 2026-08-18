import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
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
  @IsDateString()
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
