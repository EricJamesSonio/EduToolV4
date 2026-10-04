// @/modules/audit-log/audit-log.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma } from '@prisma/client';

interface EnrichableLog {
  actor_id: string;
  entity_type: string;
  entity_id: string;
}

interface EnrichedFields {
  actor_name: string | null;
  actor_role: string | null;
  entity_name: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  platform_owner: 'Platform owner',
  admin: 'Admin',
  educator: 'Educator',
  student: 'Student',
};

/** "school_year" / "schoolYear" / "School Year" all become "schoolyear". */
function normalizeType(type: string): string {
  return (type ?? '').toLowerCase().replace(/[^a-z]/g, '');
}

/** Runs the query only when there is something to look up. */
function lookup<T>(ids: string[], run: () => Promise<T[]>): Promise<T[]> {
  return ids.length > 0 ? run() : Promise.resolve([]);
}

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
   * Admin-only access. Perf Phase 4: paginated {data, meta} — the log table
   * grows monotonically, so unbounded reads are no longer served.
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
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = {
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
    };

    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      data: await this.enrich(rows),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Find educator activity log entries for a specific class.
   * Visible to the assigned educator and Admin. Paginated {data, meta}.
   */
  async findActivityLogs(
    orgId: string,
    filters: {
      classId?: string;
      action?: string;
      actionContains?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = {
      org_id: orgId,
      log_type: 'activity',
      entity_type: 'class',
      ...(filters.classId ? { entity_id: filters.classId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.actionContains
        ? { action: { contains: filters.actionContains, mode: 'insensitive' as const } }
        : {}),
      ...(filters.from || filters.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      data: await this.enrich(rows),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Name resolution ─────────────────────────────────────────────────────────

  /**
   * Attaches human-readable names to a page of logs. The log only stores IDs,
   * so this does one batched lookup per entity type (never per row). Missing
   * rows (hard-deleted entities) simply resolve to null and the UI falls back
   * to the name saved in the log's metadata.
   */
  private async enrich<T extends EnrichableLog>(
    logs: T[],
  ): Promise<Array<T & EnrichedFields>> {
    if (logs.length === 0) return [];

    const actorIds = new Set<string>();
    const idsByType: Record<string, Set<string>> = {};
    for (const log of logs) {
      if (log.actor_id && log.actor_id !== 'system') actorIds.add(log.actor_id);
      const type = normalizeType(log.entity_type);
      (idsByType[type] ??= new Set()).add(log.entity_id);
    }
    const idsFor = (...types: string[]): string[] => [
      ...new Set(types.flatMap((t) => [...(idsByType[t] ?? [])])),
    ];

    const accountIds = [
      ...new Set([
        ...actorIds,
        ...idsFor('student', 'educator', 'account', 'user', 'registrar', 'admin'),
      ]),
    ];
    const sectionIds = idsFor('section');
    const classIds = idsFor('class');
    const programIds = idsFor('program', 'department');
    const schoolYearIds = idsFor('schoolyear');
    const levelIds = idsFor('level');
    const courseIds = idsFor('course');
    const strandIds = idsFor('strand');
    const subjectIds = idsFor('subject');

    const [accounts, sections, classes, programs, schoolYears, levels, courses, strands, subjects] =
      await Promise.all([
        lookup(accountIds, () =>
          this.db.account.findMany({
            where: { id: { in: accountIds } },
            select: {
              id: true,
              role: true,
              is_registrar: true,
              profile: { select: { full_name: true } },
            },
          }),
        ),
        lookup(sectionIds, () =>
          this.db.section.findMany({
            where: { id: { in: sectionIds } },
            select: {
              id: true,
              name: true,
              level: { select: { name: true } },
              course: { select: { name: true } },
              strand: { select: { name: true } },
            },
          }),
        ),
        lookup(classIds, () =>
          this.db.class.findMany({
            where: { id: { in: classIds } },
            select: { id: true, subject: { select: { name: true } } },
          }),
        ),
        lookup(programIds, () =>
          this.db.program.findMany({
            where: { id: { in: programIds } },
            select: { id: true, name: true },
          }),
        ),
        lookup(schoolYearIds, () =>
          this.db.schoolYear.findMany({
            where: { id: { in: schoolYearIds } },
            select: { id: true, name: true },
          }),
        ),
        lookup(levelIds, () =>
          this.db.level.findMany({
            where: { id: { in: levelIds } },
            select: { id: true, name: true },
          }),
        ),
        lookup(courseIds, () =>
          this.db.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, name: true },
          }),
        ),
        lookup(strandIds, () =>
          this.db.strand.findMany({
            where: { id: { in: strandIds } },
            select: { id: true, name: true },
          }),
        ),
        lookup(subjectIds, () =>
          this.db.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true },
          }),
        ),
      ]);

    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const sectionMap = new Map(sections.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c]));
    const simple = (rows: Array<{ id: string; name: string }>) =>
      new Map(rows.map((r) => [r.id, r.name]));
    const programMap = simple(programs);
    const schoolYearMap = simple(schoolYears);
    const levelMap = simple(levels);
    const courseMap = simple(courses);
    const strandMap = simple(strands);
    const subjectMap = simple(subjects);

    const accountName = (id: string): string | null =>
      accountMap.get(id)?.profile?.full_name ?? null;

    const entityName = (log: T): string | null => {
      const id = log.entity_id;
      switch (normalizeType(log.entity_type)) {
        case 'section': {
          const s = sectionMap.get(id);
          if (!s) return null;
          const where = [s.course?.name ?? s.strand?.name, s.level?.name]
            .filter(Boolean)
            .join(', ');
          return where ? `${s.name} (${where})` : s.name;
        }
        case 'class':
          return classMap.get(id)?.subject?.name ?? null;
        case 'program':
        case 'department':
          return programMap.get(id) ?? null;
        case 'schoolyear':
          return schoolYearMap.get(id) ?? null;
        case 'level':
          return levelMap.get(id) ?? null;
        case 'course':
          return courseMap.get(id) ?? null;
        case 'strand':
          return strandMap.get(id) ?? null;
        case 'subject':
          return subjectMap.get(id) ?? null;
        case 'student':
        case 'educator':
        case 'account':
        case 'user':
        case 'registrar':
        case 'admin':
          return accountName(id);
        default:
          return null;
      }
    };

    return logs.map((log) => {
      const actor = accountMap.get(log.actor_id);
      const actorRole = actor
        ? actor.is_registrar
          ? 'Registrar'
          : (ROLE_LABELS[actor.role] ?? actor.role)
        : null;
      return {
        ...log,
        actor_name:
          log.actor_id === 'system' ? 'System' : (actor?.profile?.full_name ?? null),
        actor_role: log.actor_id === 'system' ? null : actorRole,
        entity_name: entityName(log),
      };
    });
  }
}