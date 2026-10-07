// @/modules/audit-log/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { QueryAuditLogDto, QueryActivityLogDto } from './dto/audit-log.dto';
import {
  calendarDateToUtc,
  endOfDayInZone,
  parseInstant,
  startOfDayInZone,
} from '@/commons/utils/datetime.util';

/**
 * Expand a range bound to a UTC instant. Date-only bounds cover the whole
 * Manila school day (start-of-day for `from`, end-of-day for `to`); full
 * ISO bounds pass through as the exact instant. Zone-less datetimes are
 * rejected — filters are API inputs like any other.
 */
function expandBound(
  value: string | undefined,
  edge: 'start' | 'end',
): Date | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const day = calendarDateToUtc(value);
    return edge === 'start' ? startOfDayInZone(day) : endOfDayInZone(day);
  }
  return parseInstant(value);
}

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  // ── GET /audit-log ──────────────────────────────────────────────────────────

  async findAdminLogs(orgId: string, query: QueryAuditLogDto) {
    // TICK-INFRA-017: date-only `to` used to mean midnight UTC (08:00
    // Manila), silently dropping most of the day's rows.
    return this.auditLogRepository.findAdminLogs(orgId, {
      from: expandBound(query.from, 'start'),
      to: expandBound(query.to, 'end'),
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorId: query.actorId,
      page: query.page,
      limit: query.limit,
    });
  }

  // ── GET /activity-log?classId= ──────────────────────────────────────────────

  async findActivityLogs(orgId: string, query: QueryActivityLogDto) {
    return this.auditLogRepository.findActivityLogs(orgId, {
      classId: query.classId,
      action: query.action,
      actionContains: query.actionContains,
      from: expandBound(query.from, 'start'),
      to: expandBound(query.to, 'end'),
      page: query.page,
      limit: query.limit,
    });
  }

  // ── Internal write methods (called by event listeners in Phase 4) ───────────

  async logAdminAction(data: {
    orgId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: object;
  }) {
    return this.auditLogRepository.createAdminLog(data);
  }

  async logActivityEvent(data: {
    orgId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: object;
  }) {
    return this.auditLogRepository.createActivityLog(data);
  }
}
