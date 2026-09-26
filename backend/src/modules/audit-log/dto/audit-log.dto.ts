// @/modules/audit-log/dto/audit-log.dto.ts
import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── GET /audit-log ────────────────────────────────────────────────────────────

export class QueryAuditLogDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  action?: string; // filter by action type

  @IsOptional()
  @IsString()
  entityType?: string; // e.g. 'student', 'class', 'enrollment'

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  logType?: string;

  // Perf Phase 4: server-side pagination (was: unbounded full-history fetch).
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

// ── GET /activity-log?classId= ────────────────────────────────────────────────

export class QueryActivityLogDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsString()
  action?: string; // exact action filter (admin tab)

  @IsOptional()
  @IsString()
  actionContains?: string; // substring filter, case-insensitive (educator page)

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

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
