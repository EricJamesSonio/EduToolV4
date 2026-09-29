// src/modules/meeting/dto/meeting-socket.dto.ts
//
// Phase 2 (realtime safety): shared validation schemas for inbound Socket.IO
// payloads. Gateways validate with these (class-validator) instead of inline
// ad-hoc checks, so limits live in one place per event.

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Mirror of the Groupy REST text cap (groupy.dto.ts SendGroupyMessageDto). */
export const MEETING_CHAT_MAX_LENGTH = 2000;

/** Upper bound for educator-controlled slide index (rejects NaN/huge). */
export const MEETING_MAX_SLIDE = 10_000;

/** Allowlist mirrored from the client ReactionPicker limiter (server-enforced). */
export const MEETING_REACTION_EMOJIS = [
  '👍',
  '👏',
  '❤️',
  '😂',
  '😮',
  '🎉',
] as const;

/** Max JSON bytes for a relayed WebRTC offer/answer/ICE candidate. */
export const SIGNALING_MAX_BYTES = 8 * 1024;

export class MeetingChatSendDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MEETING_CHAT_MAX_LENGTH)
  message!: string;
}

export class MeetingReactionDto {
  @IsString()
  @IsIn([...MEETING_REACTION_EMOJIS])
  emoji!: string;
}

export class MeetingSlideChangeDto {
  @IsInt()
  @Min(0)
  @Max(MEETING_MAX_SLIDE)
  slide!: number;
}

export class MeetingPresentationStartDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  presentationId?: string;
}

export class WebrtcTargetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  targetUserId!: string;
}

/** True when a relayed signaling payload exceeds the byte cap. */
export function isSignalingPayloadTooLarge(payload: unknown): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(payload ?? {}), 'utf8') >
      SIGNALING_MAX_BYTES;
  } catch {
    return true;
  }
}
