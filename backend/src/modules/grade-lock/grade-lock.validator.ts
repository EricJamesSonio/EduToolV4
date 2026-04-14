// ===== File: backend/src/modules/grade-lock/grade-lock.validator.ts =====

import { Injectable, ForbiddenException } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

export interface GradeEditCheckResult {
  allowed: boolean
  reason?: string // e.g., "Class is locked", "Deadline has passed", "Admin override required"
}

export interface GradeEditCheckInput {
  classId: string
  userId: string
  userRole: string // 'admin' | 'educator' | 'student'
  orgId: string
}

/**
 * CENTRALIZED GUARD for all grade mutations
 * Used by: Grade updates, ManualScore updates, Submission grading, etc.
 *
 * Logic:
 * 1. Check if class is manually locked
 * 2. Check if deadline has passed
 * 3. Allow admin override after deadline
 * 4. Block educators after deadline
 */
@Injectable()
export class GradeLockValidator {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Check if a user can edit grades for a class
   * Returns: { allowed: boolean, reason?: string }
   */
  async canEditGrades(input: GradeEditCheckInput): Promise<GradeEditCheckResult> {
    const { classId, userId, userRole, orgId } = input

    // ===== STEP 1: Fetch class and grade lock status =====
    const gradeLock = await this.db.gradeLock.findUnique({
      where: { class_id: classId },
      include: {
        class: {
          select: {
            school_year_id: true,
            educator_id: true,
          },
        },
      },
    })

    if (!gradeLock) {
      // No grade lock record yet = not locked
      return { allowed: true }
    }

    // ===== STEP 2: Check if class is manually locked =====
    if (gradeLock.is_locked) {
      // Only admin can edit if manually locked
      if (userRole === 'admin') {
        return { allowed: true } // Admin override
      }
      return {
        allowed: false,
        reason: 'Class is locked by administrator',
      }
    }

    // ===== STEP 3: Check deadline (dynamic check, no cron) =====
    const schoolYearId = gradeLock.class.school_year_id

    const lockSetting = await this.db.gradeLockSetting.findUnique({
      where: {
        org_id_school_year_id: {
          org_id: orgId,
          school_year_id: schoolYearId,
        },
      },
    })

    if (lockSetting) {
      const now = new Date()
      const deadlineHasPassed = now > lockSetting.lock_deadline

      if (deadlineHasPassed) {
        // Deadline has passed
        if (userRole === 'admin') {
          return { allowed: true } // Admin can override deadline
        }
        return {
          allowed: false,
          reason: `Grading deadline has passed (${lockSetting.lock_deadline.toISOString()}). Contact administrator for override.`,
        }
      }
    }

    // ===== STEP 4: Not locked and not past deadline = allow =====
    return { allowed: true }
  }

  /**
   * Throw if not allowed (convenience method for guard usage)
   */
  async assertCanEditGrades(input: GradeEditCheckInput): Promise<void> {
    const result = await this.canEditGrades(input)
    if (!result.allowed) {
      throw new ForbiddenException(result.reason || 'Cannot edit grades at this time')
    }
  }
}