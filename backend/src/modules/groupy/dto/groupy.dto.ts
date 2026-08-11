import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  MinLength,
  MaxLength,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GroupyMessageType, GroupyReactionType } from '@prisma/client';

// Base send DTO for text messages. Future phases extend this same endpoint
// (gif / sticker / poll types) by adding optional fields here without
// breaking the existing POST contract.
export class SendGroupyMessageDto {
  @IsOptional()
  @IsEnum(GroupyMessageType)
  type?: GroupyMessageType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body?: string;

  @IsOptional()
  @IsString()
  gifUrl?: string;

  @IsOptional()
  @IsString()
  stickerId?: string;
}

export class ListMessagesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SetReactionDto {
  @IsEnum(GroupyReactionType)
  reactionType: GroupyReactionType;
}

export class CreatePollDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  options: string[];
}

export class VotePollDto {
  @IsString()
  optionId: string;
}

export class ReportReadDto {
  @IsString()
  lastMessageId: string;
}

export class StartMeetingDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invitedStudentIds?: string[]; // empty/undefined = invite the whole class roster
}