// @/modules/grade-lock/grade-lock.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradeLockRepository {
  constructor(private readonly db: DatabaseService) {}

  // ───────── SETTINGS ─────────

  async upsertSetting(data: {
    orgId: string;
    schoolYearId: string;
    lockDeadline: Date;
  }) {
    return this.db.gradeLockSetting.upsert({
      where: {
        org_id_school_year_id: {
          org_id: data.orgId,
          school_year_id: data.schoolYearId,
        },
      },
      update: { lock_deadline: data.lockDeadline },
      create: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        lock_deadline: data.lockDeadline,
      },
    });
  }

  async getSetting(orgId: string, schoolYearId: string) {
    return this.db.gradeLockSetting.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId },
    });
  }

  async findExpiredSettings(orgId: string) {
    const now = new Date();
    return this.db.gradeLockSetting.findMany({
      where: {
        org_id: orgId,
        lock_deadline: { lte: now },
      },
    });
  }

  // ───────── CLASS LOCK ─────────

  async findByClassId(classId: string) {
    return this.db.gradeLock.findUnique({
      where: { class_id: classId },
    });
  }

  async upsert(data: {
    orgId: string;
    classId: string;
    isLocked: boolean;
    lockedBy: string;
    lockedAt: Date | null;
  }) {
    return this.db.gradeLock.upsert({
      where: { class_id: data.classId },
      update: {
        is_locked: data.isLocked,
        locked_by: data.lockedBy,
        locked_at: data.lockedAt,
      },
      create: {
        org_id: data.orgId,
        class_id: data.classId,
        is_locked: data.isLocked,
        locked_by: data.lockedBy,
        locked_at: data.lockedAt,
      },
    });
  }

  async updateLock(classId: string, data: {
    is_locked: boolean;
    locked_by: string;
    locked_at: Date | null;
  }) {
    return this.db.gradeLock.update({
      where: { class_id: classId },
      data,
    });
  }

  async getClassLocks(orgId: string) {
    return this.db.gradeLock.findMany({
      where: { org_id: orgId },
      include: { class: true },
    });
  }

  // ───────── GRADING SCALE LOCK ─────────

  async findLevelIdForClass(classId: string, orgId: string): Promise<string | null> {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { subject_id: true },
    });
    if (!cls) return null;

    const subject = await this.db.subject.findFirst({
      where: { id: cls.subject_id, org_id: orgId },
      select: { level_id: true },
    });

    return subject?.level_id ?? null;
  }

async lockGradingScale(
  programId: string,            // ✅ CHANGED
  schoolYearId: string,
  orgId: string,
) {
  return this.db.gradingScale.updateMany({
    where: {
      org_id: orgId,
      program_id: programId,     // ✅ CHANGED
      school_year_id: schoolYearId,
      is_locked: false,
    },
      data: {
        is_locked: true,
        locked_at: new Date(),
      },
    });
  }
}