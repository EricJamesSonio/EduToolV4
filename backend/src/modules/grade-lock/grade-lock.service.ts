// @/modules/grade-lock/grade-lock.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { GradeLockRepository } from './grade-lock.repository';
import { ClassRepository } from '../class/class.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GradeService } from '../grade/grade.service';
import { CreateGradeLockSettingDto, QueryGradeLockDto } from './dto/grade-lock.dto';

@Injectable()
export class GradeLockService {
  constructor(
    private readonly gradeLockRepo: GradeLockRepository,
    private readonly classRepo: ClassRepository,
    private readonly auditLog: AuditLogService,
    private readonly gradeService: GradeService,
  ) {}

  // ───────── SETTINGS ─────────

  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    return this.gradeLockRepo.upsertSetting({
      orgId,
      schoolYearId: dto.schoolYearId,
      lockDeadline: new Date(dto.lockDeadline),
    });
  }

  async getSetting(orgId: string, schoolYearId: string) {
    return this.gradeLockRepo.getSetting(orgId, schoolYearId);
  }

  // ───────── LOCK CLASS (EDUCATOR) ─────────

  async lockClass(classId: string, user: any) {
    const cls = await this.classRepo.findById(classId, user.orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (cls.educator_id !== user.id) {
      throw new ForbiddenException('You do not own this class.');
    }

    const setting = await this.gradeLockRepo.getSetting(
      user.orgId,
      cls.school_year_id,
    );

    if (!setting) {
      throw new ForbiddenException('Grade lock setting not configured.');
    }

    const now = new Date();

    if (now > setting.lock_deadline) {
      throw new ForbiddenException('Lock deadline has passed.');
    }

    const existing = await this.gradeLockRepo.findByClassId(classId);

    if (existing?.is_locked) {
      throw new ForbiddenException('Class already locked.');
    }

    await this.gradeLockRepo.upsert({
      orgId: user.orgId,
      classId,
      isLocked: true,
      lockedBy: user.id,
      lockedAt: now,
    });

    await this.gradeService.publishAllByClass(classId, user.orgId);

    await this.auditLog.logAdminAction({
      orgId: user.orgId,
      actorId: user.id,
      action: 'GRADE_LOCK',
      entityType: 'CLASS',
      entityId: classId,
    });

    return { success: true };
  }

  // ───────── UNLOCK (ADMIN) ─────────

  async unlockClass(classId: string, user: any) {
    const cls = await this.classRepo.findById(classId, user.orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admin can unlock grades.');
    }

    const lock = await this.gradeLockRepo.findByClassId(classId);

    if (!lock || !lock.is_locked) {
      throw new ForbiddenException('Class is not locked.');
    }

    await this.gradeLockRepo.upsert({
      orgId: user.orgId,
      classId,
      isLocked: false,
      lockedBy: user.id,
      lockedAt: null,
    });

    await this.auditLog.logAdminAction({
      orgId: user.orgId,
      actorId: user.id,
      action: 'GRADE_UNLOCK_OVERRIDE',
      entityType: 'CLASS',
      entityId: classId,
    });

    return { success: true };
  }

  // ───────── ADMIN VIEW ─────────

  async getClassLocks(orgId: string, query: QueryGradeLockDto) {
    return this.gradeLockRepo.getClassLocks(orgId);
  }

  // ───────── AUTO LOCK (CRON) ─────────

  async autoLock(orgId: string) {
    const settings = await this.gradeLockRepo.findExpiredSettings(orgId);

    for (const setting of settings) {
      const classes = await this.classRepo.findBySchoolYear(
        setting.school_year_id,
        orgId,
      );

      for (const cls of classes) {
        const existing = await this.gradeLockRepo.findByClassId(cls.id);
        if (existing?.is_locked) continue;

        await this.gradeLockRepo.upsert({
          orgId,
          classId: cls.id,
          isLocked: true,
          lockedBy: 'system',
          lockedAt: new Date(),
        });

        await this.gradeService.publishAllByClass(cls.id, orgId);

        await this.auditLog.logAdminAction({
          orgId,
          actorId: 'system',
          action: 'AUTO_GRADE_LOCK',
          entityType: 'CLASS',
          entityId: cls.id,
        });
      }
    }
  }
}