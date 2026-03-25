// @/modules/audit-log/dto/audit-log.dto.ts
import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

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
}

// ── GET /activity-log?classId= ────────────────────────────────────────────────

export class QueryActivityLogDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}