import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { GradeLockRepository } from './grade-lock.repository';
import { GradeLockValidator } from './grade-lock.validator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { DatabaseService } from '@/core/database/database.provider';
import { resolveDeadline } from './grade-lock.utils';
import { runInTx } from '@/commons/utils/prisma-transaction.util';
import type {
  AssignSettingDto,
  AssignSettingBulkDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
} from './dto/grade-lock.dto';

/** Max rows per internal statement. Keeps each query under Postgres' 65535
 *  bind-parameter ceiling and keeps transactions short on very large years. */
const BULK_SUB_BATCH = 1000;

/** Interactive-transaction ceiling for the bulk write. */
const BULK_TX_TIMEOUT_MS = 15_000;

export interface BulkAssignResult {
  assigned: number;
  skippedLocked: number;
  skippedUnchanged: number;
  skippedInvalid: number;
}

/** Split into sub-batches of at most `size` without per-row awaits. */
function subBatches<T>(items: T[], size: number = BULK_SUB_BATCH): T[][] {
  if (items.length <= size) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

@Injectable()
export class GradeLockOperationsService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly validator: GradeLockValidator,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly db: DatabaseService,
  ) {}

  async assignSetting(orgId: string, actorId: string, dto: AssignSettingDto) {
    const [cls, setting] = await Promise.all([
      this.repo.findClassById(dto.class_id),
      this.repo.findSettingById(orgId, dto.setting_id),
    ]);

    if (!cls || cls.deleted_at) throw new NotFoundException('Class not found');
    if (!setting) throw new NotFoundException('Grade lock setting not found');

    const existing = await this.repo.findLockByClassId(dto.class_id);
    if (existing?.is_locked) {
      throw new ForbiddenException(
        'Cannot reassign setting: class is currently locked',
      );
    }

    const gradeLock = await this.repo.upsertLock(
      orgId,
      dto.class_id,
      dto.setting_id,
    );

    await this.repo.createEvent({
      org_id: orgId,
      class_id: dto.class_id,
      actor_id: actorId,
      type: 'request',
      reason: 'Setting assigned',
    });

    return gradeLock;
  }

  /**
   * Apply one template to many classes.
   *
   * Cost model: a fixed number of statements per request regardless of how many
   * classes are targeted. No per-class loop, no per-class await, no
   * Promise.all over classes.
   *
   *   1. setting lookup                       (read, pre-transaction)
   *   2. active class ids                     (read, pre-transaction)
   *   3. current lock states                  (read, pre-transaction)
   *   4. reassign unlocked / on another setting (write, in transaction)
   *   5. create missing locks                 (write, in transaction)
   *   6. events for rows that actually changed (write, in transaction)
   *   7. one audit summary                    (post-transaction, non-blocking)
   *
   * Reads happen BEFORE the transaction opens so the transaction only spans the
   * three writes and stays short. Steps 4-6 are idempotent: a class already on
   * the target setting is filtered out, so a re-run rewrites nothing and emits
   * no duplicate events.
   */
  async assignSettingBulk(
    orgId: string,
    actorId: string,
    dto: AssignSettingBulkDto,
  ): Promise<BulkAssignResult> {
    const setting = await this.repo.findSettingById(orgId, dto.setting_id);
    if (!setting) throw new NotFoundException('Grade lock setting not found');

    // De-duplicate first: the client chunks, so a repeat across a chunk
    // boundary would otherwise be double-counted in the skip totals.
    const requested = [...new Set(dto.class_ids)];

    // ── Reads (outside the transaction) ─────────────────────────────────────
    const validIds: string[] = [];
    for (const batch of subBatches(requested)) {
      validIds.push(
        ...(await this.repo.findActiveClassIds(this.db, orgId, batch)),
      );
    }

    const lockStates = await this.repo.findLockStates(
      this.db,
      orgId,
      validIds,
    );
    const stateByClass = new Map(lockStates.map((l) => [l.class_id, l]));

    // ── Partition (in memory, no queries) ───────────────────────────────────
    // Precedence: locked > unchanged > assignable. A locked class is reported
    // as skipped-locked even if it is also already on this setting, so the
    // four counters always sum to `requested.length`.
    const toUpdate: string[] = [];
    const toCreate: string[] = [];
    let skippedLocked = 0;
    let skippedUnchanged = 0;

    for (const id of validIds) {
      const state = stateByClass.get(id);
      if (!state) {
        toCreate.push(id);
      } else if (state.is_locked) {
        skippedLocked += 1;
      } else if (state.setting_id === dto.setting_id) {
        skippedUnchanged += 1;
      } else {
        toUpdate.push(id);
      }
    }

    const changed = [...toUpdate, ...toCreate];

    // ── Writes (one transaction, sub-batched) ──────────────────────────────
    if (changed.length > 0) {
      await runInTx(
        this.db,
        async (tx) => {
          for (const batch of subBatches(toUpdate)) {
            await this.repo.reassignUnlocked(
              tx,
              orgId,
              batch,
              dto.setting_id,
            );
          }
          for (const batch of subBatches(toCreate)) {
            await this.repo.createLocks(tx, orgId, batch, dto.setting_id);
          }
          // Events only for rows that actually changed — a no-op re-run must
          // not spam the event table.
          for (const batch of subBatches(changed)) {
            await this.repo.createEvents(
              tx,
              batch.map((class_id) => ({
                org_id: orgId,
                class_id,
                actor_id: actorId,
                type: 'request',
                reason: 'Setting assigned',
              })),
            );
          }
        },
        { timeout: BULK_TX_TIMEOUT_MS },
      );
    }

    const result: BulkAssignResult = {
      assigned: changed.length,
      skippedLocked,
      skippedUnchanged,
      skippedInvalid: requested.length - validIds.length,
    };

    // One summary entry per request, not one per class. Non-blocking, matching
    // the other audit calls in this file.
    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'grade_lock_bulk_assign',
        entityType: 'grade_lock_setting',
        entityId: dto.setting_id,
        metadata: {
          ...result,
          requested: requested.length,
        },
      })
      .catch(() => {});

    return result;
  }

  async autoAssignOnClassCreate(
    orgId: string,
    classId: string,
    settingId?: string,
  ): Promise<void> {
    const resolvedId =
      settingId ?? (await this.repo.findDefaultSetting(orgId))?.id;
    if (!resolvedId) return;

    await this.repo.createLock(orgId, classId, resolvedId);
  }

  async lockClass(
    classId: string,
    userId: string,
    orgId: string,
    dto: LockClassDto = {},
  ) {
    const cls = await this.repo.findClassById(classId);
    if (!cls) throw new NotFoundException('Class not found');
    if (cls.educator_id !== userId)
      throw new ForbiddenException('You do not own this class');

    const gradeLock = await this.repo.findLockByClassId(classId);
    if (!gradeLock)
      throw new NotFoundException(
        'No grade lock setting assigned to this class',
      );
    if (gradeLock.is_locked)
      throw new ConflictException('Class is already locked');

    const { isExpired, deadline } = resolveDeadline(gradeLock.setting);
    if (isExpired) {
      throw new ForbiddenException(
        `Cannot lock class after deadline (${deadline?.toISOString()})`,
      );
    }

    const readiness = await this.validator.validateReadiness(classId, orgId);
    if (!readiness.ready) {
      throw new BadRequestException({
        message: 'Grade readiness validation failed',
        issues: readiness.issues,
      });
    }

    const updated = await this.repo.setLocked(classId, userId);
    await this.repo.lockGradingScaleForClass(classId, orgId);
    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'lock',
      reason: dto.reason,
    });

    this.auditLogService
      .logActivityEvent({
        orgId,
        actorId: userId,
        action: 'grade_locked',
        entityType: 'class',
        entityId: classId,
        metadata: { reason: dto.reason ?? null },
      })
      .catch(() => {});

    // Locking releases final grades — notify every enrolled student.
    this.db.enrollment
      .findMany({
        where: { class_id: classId, org_id: orgId, status: { not: 'removed' } },
        select: { student_id: true },
      })
      .then((enrollments) => {
        if (enrollments.length === 0) return;
        return this.notificationService.createBulkNotifications(
          enrollments.map((e) => ({
            orgId,
            accountId: e.student_id,
            type: 'grade_locked',
            payload: { classId },
          })),
        );
      })
      .catch(() => {}); // non-blocking, never throws

    return { success: true, gradeLock: updated };
  }

  async unlockClass(
    classId: string,
    userId: string,
    userRole: string,
    orgId: string,
    dto: UnlockClassDto,
  ) {
    const cls = await this.repo.findClassById(classId);
    if (!cls) throw new NotFoundException('Class not found');

    if (userRole !== 'admin' && cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class');
    }

    const gradeLock = await this.repo.findLockByClassId(classId);
    if (!gradeLock)
      throw new NotFoundException('No grade lock assigned to this class');
    if (!gradeLock.is_locked)
      throw new BadRequestException('Class is not locked');

    if (userRole !== 'admin') {
      const { isExpired } = resolveDeadline(gradeLock.setting);
      if (isExpired) {
        throw new ForbiddenException(
          'Cannot unlock class after deadline. Contact administrator.',
        );
      }
    }

    const updated = await this.repo.setUnlocked(classId);

    const action =
      userRole === 'admin'
        ? 'ADMIN_CLASS_UNLOCK_OVERRIDE'
        : 'EDUCATOR_CLASS_UNLOCK';
    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'unlock',
      reason: dto.reason,
      metadata: { action, userRole },
    });

    if (userRole === 'admin') {
      this.auditLogService
        .logAdminAction({
          orgId,
          actorId: userId,
          action: 'grade_lock_override',
          entityType: 'class',
          entityId: classId,
          metadata: {
            action: 'ADMIN_CLASS_UNLOCK_OVERRIDE',
            reason: dto.reason ?? null,
            previously_locked_by: gradeLock.locked_by,
          },
        })
        .catch(() => {});
    }

    return { success: true, gradeLock: updated };
  }

  async overrideLock(
    classId: string,
    userId: string,
    orgId: string,
    dto: OverrideGradeLockDto,
  ) {
    const gradeLock = await this.repo.findLockByClassId(classId);
    if (!gradeLock)
      throw new NotFoundException('No grade lock assigned to this class');
    if (!gradeLock.is_locked)
      throw new BadRequestException(
        'Class is not locked — nothing to override',
      );
    if (!gradeLock.setting.allowOverride) {
      throw new ForbiddenException(
        'This lock setting does not permit overrides',
      );
    }

    const updated = await this.repo.setUnlocked(classId);

    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'override',
      reason: dto.reason,
      metadata: {
        previous_locked_by: gradeLock.locked_by,
        previous_locked_at: gradeLock.locked_at,
      },
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId: userId,
        action: 'grade_lock_override',
        entityType: 'class',
        entityId: classId,
        metadata: {
          reason: dto.reason ?? null,
          previous_locked_by: gradeLock.locked_by,
          previous_locked_at: gradeLock.locked_at,
        },
      })
      .catch(() => {});

    return { success: true, gradeLock: updated };
  }
}
