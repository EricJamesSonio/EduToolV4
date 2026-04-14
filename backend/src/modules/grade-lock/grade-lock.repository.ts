// ===== File: backend/src/modules/grade-lock/grade-lock.repository.ts =====

import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/database/database.provider'

@Injectable()
export class GradeLockRepository {
  constructor(private readonly db: PrismaService) {}

  /**
   * Get grade lock by class ID
   */
  async findByClassId(classId: string) {
    return this.db.gradeLock.findUnique({
      where: { class_id: classId },
    })
  }

  /**
   * Get lock setting for org + school year
   */
  async getSetting(orgId: string, schoolYearId: string) {
    return this.db.gradeLockSetting.findUnique({
      where: {
        org_id_school_year_id: {
          org_id: orgId,
          school_year_id: schoolYearId,
        },
      },
    })
  }

  /**
   * Find all expired settings (deadline passed)
   */
  async findExpiredSettings(orgId: string) {
    const now = new Date()
    return this.db.gradeLockSetting.findMany({
      where: {
        org_id: orgId,
        lock_deadline: { lte: now },
      },
    })
  }

  /**
   * Get all class locks for an org
   */
  async getClassLocks(orgId: string) {
    return this.db.gradeLock.findMany({
      where: { org_id: orgId },
      include: {
        class: {
          select: {
            id: true,
            subject_id: true,
            educator_id: true,
          },
        },
      },
    })
  }

  /**
   * Find level ID for a class (used to lock grading scale)
   */
  async findLevelIdForClass(classId: string): Promise<string | null> {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: {
        subject: {
          select: { level_id: true },
        },
      },
    })
    return cls?.subject?.level_id ?? null
  }
}