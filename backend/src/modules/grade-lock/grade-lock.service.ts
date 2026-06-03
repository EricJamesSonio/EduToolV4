// @/modules/grade-lock/grade-lock.service.ts
import { Injectable } from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'
import { GradeLockSettingsService } from './grade-lock-settings.service'
import { GradeLockOperationsService } from './grade-lock-operations.service'
import { GradeLockRequestsService } from './grade-lock-requests.service'
import { GradeLockAutoService } from './grade-lock-auto.service'
import { hydrateLocks } from './grade-lock.utils'
import type {
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
  AssignSettingDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
  RequestUnlockDto,
  GrantUnlockDto,
} from './dto/grade-lock.dto'

@Injectable()
export class GradeLockService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly settings: GradeLockSettingsService,
    private readonly operations: GradeLockOperationsService,
    private readonly requests: GradeLockRequestsService,
    private readonly auto: GradeLockAutoService,
  ) {}

  // ─── Settings — delegated ──────────────────────────────────────────────────

  createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    return this.settings.createSetting(orgId, dto)
  }

  getSettings(orgId: string) {
    return this.settings.getSettings(orgId)
  }

  getSetting(orgId: string, settingId: string) {
    return this.settings.getSetting(orgId, settingId)
  }

  updateSetting(orgId: string, settingId: string, dto: UpdateGradeLockSettingDto) {
    return this.settings.updateSetting(orgId, settingId, dto)
  }

  deleteSetting(orgId: string, settingId: string) {
    return this.settings.deleteSetting(orgId, settingId)
  }

  // ─── Assignment — delegated ─────────────────────────────────────────────────

  assignSetting(orgId: string, actorId: string, dto: AssignSettingDto) {
    return this.operations.assignSetting(orgId, actorId, dto)
  }

  async autoAssignOnClassCreate(orgId: string, classId: string, settingId?: string): Promise<void> {
    return this.operations.autoAssignOnClassCreate(orgId, classId, settingId)
  }

  // ─── Lock / Unlock / Override — delegated ───────────────────────────────────

  lockClass(classId: string, userId: string, orgId: string, dto: LockClassDto = {}) {
    return this.operations.lockClass(classId, userId, orgId, dto)
  }

  unlockClass(classId: string, userId: string, userRole: string, orgId: string, dto: UnlockClassDto) {
    return this.operations.unlockClass(classId, userId, userRole, orgId, dto)
  }

  overrideLock(classId: string, userId: string, orgId: string, dto: OverrideGradeLockDto) {
    return this.operations.overrideLock(classId, userId, orgId, dto)
  }

  // ─── Queries — owned ────────────────────────────────────────────────────────

  async getClassLocks(orgId: string) {
    const [classes, locks] = await Promise.all([
      this.repo.findAllClassesWithRelations(orgId),
      this.repo.findAllLocksWithClass(orgId),
    ])

    const lockMap = new Map(locks.map((l) => [l.class_id, l]))

    const merged = classes.map((cls) => {
      const existingLock = lockMap.get(cls.id)
      if (existingLock) return existingLock
      return {
        id: `virtual-${cls.id}`,
        org_id: orgId,
        class_id: cls.id,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        created_at: cls.created_at,
        setting: null,
        class: cls,
      }
    })

    return hydrateLocks(merged, orgId, (ids) => this.repo.findProfilesByAccountIds(ids))
  }

  async getClassLocksBySchoolYear(orgId: string, schoolYearId: string) {
    const [classes, locks] = await Promise.all([
      this.repo.findAllClassesWithRelations(orgId),
      this.repo.findLocksBySchoolYear(orgId, schoolYearId),
    ])

    const filteredClasses = classes.filter(
      (cls) => cls.school_year_id === schoolYearId,
    )

    const lockMap = new Map(locks.map((l) => [l.class_id, l]))

    const merged = filteredClasses.map((cls) => {
      const existingLock = lockMap.get(cls.id)
      if (existingLock) return existingLock
      return {
        id: `virtual-${cls.id}`,
        org_id: orgId,
        class_id: cls.id,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        created_at: cls.created_at,
        setting: null,
        class: cls,
      }
    })

    return hydrateLocks(merged, orgId, (ids) => this.repo.findProfilesByAccountIds(ids))
  }

  getEventsForClass(orgId: string, classId: string) {
    return this.repo.findEventsByClassId(orgId, classId)
  }

  // ─── Auto-lock — delegated ──────────────────────────────────────────────────

  autoLockExpiredClasses(orgId: string) {
    return this.auto.autoLockExpiredClasses(orgId)
  }

  // ─── Unlock Requests — delegated ────────────────────────────────────────────

  getClassLockInfo(classId: string, orgId: string) {
    return this.requests.getClassLockInfo(classId, orgId)
  }

  requestUnlock(classId: string, userId: string, orgId: string, dto: RequestUnlockDto) {
    return this.requests.requestUnlock(classId, userId, orgId, dto)
  }

  getUnlockRequests(orgId: string) {
    return this.requests.getUnlockRequests(orgId)
  }

  grantUnlock(classId: string, userId: string, orgId: string, dto: GrantUnlockDto) {
    return this.requests.grantUnlock(classId, userId, orgId, dto)
  }

  denyUnlock(classId: string, userId: string, orgId: string, reason: string) {
    return this.requests.denyUnlock(classId, userId, orgId, reason)
  }
}
