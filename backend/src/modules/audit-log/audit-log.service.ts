// @/modules/audit-log/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { QueryAuditLogDto, QueryActivityLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  // ── GET /audit-log ──────────────────────────────────────────────────────────

  async findAdminLogs(orgId: string, query: QueryAuditLogDto) {
    return this.auditLogRepository.findAdminLogs(orgId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorId: query.actorId,
    });
  }

  // ── GET /activity-log?classId= ──────────────────────────────────────────────

  async findActivityLogs(orgId: string, query: QueryActivityLogDto) {
    return this.auditLogRepository.findActivityLogs(orgId, {
      classId: query.classId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
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
