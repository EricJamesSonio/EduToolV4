// @/modules/notification/dto/notification.dto.ts
import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ── GET /notifications ────────────────────────────────────────────────────────

export class QueryNotificationDto {
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  // Perf Phase 4: bounded inbox reads (was: unbounded full-inbox fetch).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
