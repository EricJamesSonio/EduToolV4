import type { DatabaseService } from '@/core/database/database.provider';

// Children first, so parents can be removed without foreign-key violations.
const ORG_SCOPED_MODELS = [
  'notification',
  'auditLog',
  'assessmentGradingOverride',
  'submissionAnswer',
  'submission',
  'question',
  'assessment',
  'manualScore',
  'grade',
  'gradeLockEvent',
  'gradeLock',
  'gradeLockSetting',
  'attendanceRecord',
  'attendanceSession',
  'enrollment',
  'classSchedule',
  'classOwnershipLog',
  'gradingSchemeComponent',
  'gradingScheme',
  'class',
  'subjectCompletionOverride',
  'classAssignmentRequest',
  'programShiftEvent',
  'studentProgramEnrollment',
  'studentSchoolYear',
  'educatorSubject',
  'educatorScheduleProfile',
  'subjectPrerequisite',
  'subjectSharing',
  'subject',
  'term',
  'semester',
  'programSemesterTermDate',
  'programSemesterAssignment',
  'semesterTemplateTerm',
  'semesterTemplateItem',
  'semesterTemplate',
  'gradingScaleAssignment',
  'gradingScale',
  'gradingSchemeProgramAssignment',
  'gradingSchemeTemplateComponent',
  'gradingSchemeTemplate',
  'programCalendarHoliday',
  'programCalendarTerm',
  'programCalendarBreak',
  'programCalendar',
  'orgHolidayConfig',
  'academicCalendar',
  'section',
  'level',
  'strand',
  'course',
  'program',
  'schoolProfileDepartment',
  'schoolProfileGradingScale',
  'schoolProfileGradingScheme',
  'schoolProfileSemesterTermConfig',
  'concernCategory',
  'orgConcernSetting',
  'orgEnrollmentSetting',
  'orgScheduleConfig',
  'enrollmentPeriod',
  'room',
] as const;

export interface CleanupTarget {
  orgId?: string;
  accountIds: string[];
}

type DeleteManyDelegate = { deleteMany: (args: object) => Promise<unknown> };

export async function cleanupOrganization(
  db: DatabaseService,
  target: CleanupTarget,
  log: (message: string) => void,
): Promise<void> {
  const delegates = db as unknown as Record<string, DeleteManyDelegate>;

  const attempt = async (
    label: string,
    run: () => Promise<unknown>,
  ): Promise<void> => {
    try {
      await run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`cleanup skipped ${label}: ${message.split('\n').pop()}`);
    }
  };

  const { orgId } = target;

  if (orgId) {
    for (const model of ORG_SCOPED_MODELS) {
      await attempt(model, () =>
        delegates[model].deleteMany({ where: { org_id: orgId } }),
      );
    }
  }

  const accountIds = new Set(target.accountIds);
  if (orgId) {
    const accounts = await db.account.findMany({
      where: { org_id: orgId },
      select: { id: true },
    });
    accounts.forEach((account) => accountIds.add(account.id));
  }
  const ids = [...accountIds];

  if (ids.length > 0) {
    await attempt('platform audit logs', () =>
      db.auditLog.deleteMany({
        where: { org_id: 'platform', entity_id: { in: ids } },
      }),
    );
    await attempt('profiles', () =>
      db.profile.deleteMany({ where: { account_id: { in: ids } } }),
    );
    await attempt('accounts', () =>
      db.account.deleteMany({ where: { id: { in: ids } } }),
    );
  }

  if (orgId) {
    await attempt('school years', () =>
      db.schoolYear.deleteMany({ where: { org_id: orgId } }),
    );
    await attempt('organization', () =>
      db.organization.deleteMany({ where: { id: orgId } }),
    );
  }
}