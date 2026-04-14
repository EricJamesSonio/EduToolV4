import { Injectable, ForbiddenException } from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'

export interface GradeEditCheckResult {
  allowed: boolean
  reason?: string
}

export interface GradeEditCheckInput {
  classId: string
  userId: string
  userRole: string // 'admin' | 'educator' | 'student'
  orgId: string
}

@Injectable()
export class GradeLockValidator {
  constructor(private readonly repo: GradeLockRepository) {}

  async canEditGrades(input: GradeEditCheckInput): Promise<GradeEditCheckResult> {
    const { classId, userRole } = input

    const gradeLock = await this.repo.findLockByClassId(classId)

    // No lock assigned — editing always allowed
    if (!gradeLock) return { allowed: true }

    if (gradeLock.is_locked) {
      if (userRole === 'admin') return { allowed: true }
      return { allowed: false, reason: 'Class is locked by administrator' }
    }

    const { setting } = gradeLock

    // Check absolute deadline
    if (setting.lock_deadline) {
      const deadlinePassed = new Date() > setting.lock_deadline
      if (deadlinePassed) {
        if (userRole === 'admin') return { allowed: true }
        return {
          allowed: false,
          reason: `Grading deadline has passed (${setting.lock_deadline.toISOString()}). Contact administrator for override.`,
        }
      }
    }

    return { allowed: true }
  }

  async assertCanEditGrades(input: GradeEditCheckInput): Promise<void> {
    const result = await this.canEditGrades(input)
    if (!result.allowed) {
      throw new ForbiddenException(result.reason ?? 'Cannot edit grades at this time')
    }
  }
}