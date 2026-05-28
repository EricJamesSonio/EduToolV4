import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { Prisma } from '@prisma/client'

@Injectable()
export class GradeLockRepository {
  constructor(private readonly db: DatabaseService) {}

  // ─── Settings ──────────────────────────────────────────────────────────────

  async createSetting(orgId: string, data: {
    name: string
    description?: string
    lockType: string
    lock_deadline?: Date | null
    deadlineDays?: number | null
    allowOverride: boolean
    is_default: boolean
  }) {
    return this.db.gradeLockSetting.create({
      data: { org_id: orgId, ...data },
    })
  }

  async findAllSettings(orgId: string) {
    return this.db.gradeLockSetting.findMany({
      where: { org_id: orgId },
      include: { _count: { select: { gradeLocks: true } } },
      orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
    })
  }

  async findSettingById(orgId: string, settingId: string) {
    return this.db.gradeLockSetting.findFirst({
      where: { id: settingId, org_id: orgId },
      include: { _count: { select: { gradeLocks: true } } },
    })
  }

  async updateSetting(settingId: string, data: Partial<{
    name: string
    description: string
    lockType: string
    lock_deadline: Date | null
    deadlineDays: number | null
    allowOverride: boolean
    is_default: boolean
  }>) {
    return this.db.gradeLockSetting.update({
      where: { id: settingId },
      data,
    })
  }

  async clearDefaultSettings(orgId: string, excludeId?: string) {
    return this.db.gradeLockSetting.updateMany({
      where: {
        org_id: orgId,
        is_default: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      data: { is_default: false },
    })
  }

  async countActiveLocksForSetting(orgId: string, settingId: string) {
    return this.db.gradeLock.count({
      where: { org_id: orgId, setting_id: settingId, is_locked: true },
    })
  }

  async deleteLocksForSetting(orgId: string, settingId: string) {
    return this.db.gradeLock.deleteMany({
      where: { org_id: orgId, setting_id: settingId },
    })
  }

  async deleteSetting(settingId: string) {
    return this.db.gradeLockSetting.delete({ where: { id: settingId } })
  }

  async findDefaultSetting(orgId: string) {
    return this.db.gradeLockSetting.findFirst({
      where: { org_id: orgId, is_default: true },
      select: { id: true },
    })
  }

  // ─── GradeLock (per-class) ─────────────────────────────────────────────────

  async findLockByClassId(classId: string) {
    return this.db.gradeLock.findUnique({
      where: { class_id: classId },
      include: { setting: true },
    })
  }

  async upsertLock(orgId: string, classId: string, settingId: string) {
    return this.db.gradeLock.upsert({
      where: { class_id: classId },
      create: { org_id: orgId, class_id: classId, setting_id: settingId },
      update: { setting_id: settingId },
      include: { setting: true },
    })
  }

  async createLock(orgId: string, classId: string, settingId: string) {
    return this.db.gradeLock.create({
      data: { org_id: orgId, class_id: classId, setting_id: settingId },
    })
  }

  async setLocked(classId: string, lockedBy: string) {
    return this.db.gradeLock.update({
      where: { class_id: classId },
      data: { is_locked: true, locked_at: new Date(), locked_by: lockedBy },
      include: { setting: true },
    })
  }

  async setUnlocked(classId: string) {
    return this.db.gradeLock.update({
      where: { class_id: classId },
      data: { is_locked: false, locked_at: null, locked_by: null },
      include: { setting: true },
    })
  }

  async findAllLocksWithClass(orgId: string) {
    return this.db.gradeLock.findMany({
      where: { org_id: orgId },
      include: {
        setting: true,
        class: {
          select: {
            id: true,
            subject_id: true,
            educator_id: true,
            school_year_id: true,
            subject: {
              include: {
                program: { select: { id: true, name: true } },
                course:  { select: { id: true, name: true } },
                strand:  { select: { id: true, name: true } },
                level:   { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async findLocksBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.gradeLock.findMany({
      where: {
        org_id: orgId,
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      include: {
        setting: true,
        class: {
          select: {
            id: true,
            subject_id: true,
            educator_id: true,
            school_year_id: true,
            subject: {
              include: {
                program: { select: { id: true, name: true } },
                course:  { select: { id: true, name: true } },
                strand:  { select: { id: true, name: true } },
                level:   { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  // Fetch all unlocked locks whose setting deadline has passed — used by autoLock
  async findExpiredUnlockedLocks(orgId: string, now: Date) {
    return this.db.gradeLock.findMany({
      where: {
        org_id: orgId,
        is_locked: false,
        setting: { lock_deadline: { lte: now } },
        class: { deleted_at: null },
      },
      include: {
        setting: true,
        class: { select: { id: true, school_year_id: true } },
      },
    })
  }

  // For deadlineDays-based auto-lock: fetch all unlocked locks + their school year end_date
  async findUnlockedLocksWithSchoolYear(orgId: string) {
    return this.db.gradeLock.findMany({
      where: {
        org_id: orgId,
        is_locked: false,
        setting: { deadlineDays: { not: null } },
        class: { deleted_at: null },
      },
      include: {
        setting: true,
        class: {
          select: {
            id: true,
            school_year_id: true,
            schoolYear: { select: { end_date: true } },
          },
        },
      },
    })
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  async createEvent(data: {
    org_id: string
    class_id: string
    actor_id: string
    type: string
    reason?: string
    metadata?: Prisma.InputJsonValue
  }) {
    return this.db.gradeLockEvent.create({ data })
  }

  async findEventsByClassId(orgId: string, classId: string) {
    return this.db.gradeLockEvent.findMany({
      where: { org_id: orgId, class_id: classId },
      orderBy: { created_at: 'desc' },
    })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  async findClassById(classId: string) {
    return this.db.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        org_id: true,
        educator_id: true,
        school_year_id: true,
        deleted_at: true,
      },
    })
  }

  async findLevelByClassId(classId: string) {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: { subject: { select: { level_id: true } } },
    })
    return cls?.subject?.level_id ?? null
  }

  async lockGradingScaleForClass(classId: string, orgId: string) {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: { subject: { select: { level_id: true } } },
    })
    if (!cls?.subject?.level_id) return

    const level = await this.db.level.findUnique({
      where: { id: cls.subject.level_id },
      select: { program_id: true, school_year_id: true },
    })
    if (!level) return

    const assignment = await this.db.gradingScaleAssignment.findFirst({
      where: {
        org_id: orgId,
        program_id: level.program_id,
        school_year_id: level.school_year_id,
      },
    })
    if (!assignment) return

    await this.db.gradingScale.update({
      where: { id: assignment.grading_scale_id },
      data: { is_locked: true, locked_at: new Date() },
    })
  }

  async findAllClassesWithRelations(orgId: string) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
      },
      include: {
        subject: {
          include: {
            program: { select: { id: true, name: true } },
            course:  { select: { id: true, name: true } },
            strand:  { select: { id: true, name: true } },
            level:   { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async findProfilesByAccountIds(accountIds: string[]) {
    return this.db.profile.findMany({
      where: { account_id: { in: accountIds } },
      select: { account_id: true, full_name: true },
    })
  }
}