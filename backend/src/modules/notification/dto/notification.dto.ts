// @/modules/notification/dto/notification.dto.ts
import { IsOptional, IsBoolean } from 'class-validator';

// ── GET /notifications ────────────────────────────────────────────────────────

export class QueryNotificationDto {
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}