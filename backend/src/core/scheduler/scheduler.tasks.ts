import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { GradeLockService }          from '@/modules/grade-lock/grade-lock.service'
import { SubmissionService }         from '@/modules/submission/submission.service'
import { NotificationService }       from '@/modules/notification/notification.service'
import { OrgEnrollmentSettingService } from '@/modules/org-enrollment-setting/org-enrollment-setting.service'
import { DatabaseService }           from '@/core/database/database.provider'

@Injectable()
export class SchedulerTasks {
  private readonly logger = new Logger(SchedulerTasks.name)

  constructor(
    private readonly gradeLockService:          GradeLockService,
    private readonly submissionService:         SubmissionService,
    private readonly notificationService:       NotificationService,
    private readonly orgEnrollmentSettingService: OrgEnrollmentSettingService,
    private readonly db:                        DatabaseService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoGradeLock() {
    this.logger.log('Running auto grade lock check...')
    try {
      const orgs = await this.db.account.findMany({
        where:    { role: 'admin', status: 'active', org_id: { not: null } },
        select:   { org_id: true },
        distinct: ['org_id'],
      })
      for (const { org_id } of orgs) {
        if (org_id) await this.gradeLockService.autoLockExpiredClasses(org_id)
      }
    } catch (err) {
      this.logger.error('Auto grade lock failed', err)
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCloseExpiredDrafts() {
    this.logger.log('Closing expired draft submissions...')
    try {
      const expired = await this.db.assessment.findMany({
        where:  { end_date: { lt: new Date() }, deleted_at: null },
        select: { id: true },
      })
      for (const { id } of expired) {
        await this.submissionService.closeExpiredDrafts(id)
      }
    } catch (err) {
      this.logger.error('Close expired drafts failed', err)
    }
  }

  @Cron('0 2 * * *')
  async handleNotificationArchiving() {
    this.logger.log('Archiving old notifications...')
    try {
      await this.notificationService.archiveOldNotifications()
    } catch (err) {
      this.logger.error('Notification archiving failed', err)
    }
  }

  /**
   * Runs nightly at 03:00.
   * For each active school year whose end_date has passed:
   *   - If org has auto_unenroll_on_year_end = true → remove all active
   *     class-level Enrollment rows for that school year's classes.
   *   - Then marks the school year as ended.
   */
  @Cron('0 3 * * *')
  async handleAutoUnenrollOnYearEnd() {
    this.logger.log('Running auto unenroll on school year end...')
    try {
      const expiredYears = await this.db.schoolYear.findMany({
        where:  { status: 'active', end_date: { lt: new Date() } },
        select: { id: true, org_id: true },
      })

      if (expiredYears.length === 0) return

      for (const { id: schoolYearId, org_id } of expiredYears) {
        try {
          const setting = await this.orgEnrollmentSettingService.getByOrg(org_id)

          if (setting.auto_unenroll_on_year_end) {
            // Unenroll class enrollments
            const classResult = await this.db.enrollment.updateMany({
              where: {
                org_id,
                status: 'active',
                class: { school_year_id: schoolYearId, deleted_at: null },
              },
              data: { status: 'removed' },
            })

            // Unenroll StudentSchoolYear records
            const studentResult = await this.db.studentSchoolYear.updateMany({
              where: {
                org_id,
                school_year_id: schoolYearId,
                status: 'active',
              },
              data: {
                status:        'unenrolled',
                unenrolled_at: new Date(),
              },
            })

            this.logger.log(
              `Auto-unenrolled ${classResult.count} class enrollment(s) and ` +
              `${studentResult.count} student(s) from school year ${schoolYearId} (org: ${org_id})`,
            )
          }

          await this.db.schoolYear.update({
            where: { id: schoolYearId },
            data:  { status: 'ended' },
          })

          this.logger.log(`School year ${schoolYearId} marked as ended.`)
        } catch (innerErr) {
          this.logger.error(
            `Failed processing school year ${schoolYearId}`,
            innerErr,
          )
        }
      }
    } catch (err) {
      this.logger.error('Auto unenroll on year end failed', err)
    }
  }
}