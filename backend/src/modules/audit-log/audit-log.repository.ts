// @/modules/audit-log/audit-log.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Write ───────────────────────────────────────────────────────────────────

  /**
   * Create an Admin audit log entry.
   * Used for high-impact administrative actions.
   */
  async createAdminLog(data: {
    orgId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: object;
  }) {
    return this.db.auditLog.create({
      data: {
        org_id: data.orgId,
        actor_id: data.actorId,
        log_type: 'admin',
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });
  }

  /**
   * Create an Educator activity log entry.
   * Scoped to a class — uses entity_type = 'class' + entity_id = classId
   * with the specific event stored in action field.
   */
  async createActivityLog(data: {
    orgId: string;
    actorId: string; // educatorId
    action: string;
    entityType: string;
    entityId: string; // classId
    metadata?: object;
  }) {
    return this.db.auditLog.create({
      data: {
        org_id: data.orgId,
        actor_id: data.actorId,
        log_type: 'activity',
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  /**
   * Find admin audit log entries with optional filters.
   * Admin-only access.
   */
  async findAdminLogs(
    orgId: string,
    filters: {
      from?: Date;
      to?: Date;
      action?: string;
      entityType?: string;
      entityId?: string;
      actorId?: string;
    },
  ) {
    return this.db.auditLog.findMany({
      where: {
        org_id: orgId,
        log_type: 'admin',
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entity_type: filters.entityType } : {}),
        ...(filters.entityId ? { entity_id: filters.entityId } : {}),
        ...(filters.actorId ? { actor_id: filters.actorId } : {}),
        ...(filters.from || filters.to
          ? {
              created_at: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Find educator activity log entries for a specific class.
   * Visible to the assigned educator and Admin.
   */
  async findActivityLogs(
    orgId: string,
    filters: {
      classId?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    return this.db.auditLog.findMany({
      where: {
        org_id: orgId,
        log_type: 'activity',
        entity_type: 'class',
        ...(filters.classId ? { entity_id: filters.classId } : {}),
        ...(filters.from || filters.to
          ? {
              created_at: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
