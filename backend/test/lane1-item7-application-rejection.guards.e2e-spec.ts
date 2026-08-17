// backend/test/lane1-item7-application-rejection.guards.e2e-spec.ts
//
// Lane 1 item 7 — proof tests against the REAL database.
//
// (a) A rejected application is committed to the data trail (status / reason /
//     reviewer), a corresponding admin audit record exists, and a re-application
//     from the SAME applicant in the SAME school year is rejected — i.e. a
//     rejected application can never be silently re-placed.
// (b) The write-time immutability guard is state-machined, not generic:
//     `updateApplication` blocks ONLY `locked`/`approved`
//     (enrollment-portal.service.ts:236), so a rejected application remains
//     editable but its status stays `rejected`; meanwhile the review path
//     (`requireReviewable`) refuses to approve a rejected application.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CoreModule } from '@/core/core.module';
import { EnrollmentPortalModule } from '@/modules/enrollment-portal/enrollment-portal.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { StudentModule } from '@/modules/student/student.module';
import { StudentEnrollmentModule } from '@/modules/student-enrollment/student-enrollment.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { SchoolYearModule } from '@/modules/school-year/school-year.module';
import { DatabaseService } from '@/core/database/database.provider';
import { EnrollmentPortalService } from '@/modules/enrollment-portal/enrollment-portal.service';
import { EnrollmentRegistrarService } from '@/modules/enrollment-portal/registrar/enrollment-registrar.service';
import type { EnrollmentSessionClaims } from '@/modules/enrollment-portal/entity/enrollment-portal.entity';
import type { UpsertEnrollmentApplicationDto } from '@/modules/enrollment-portal/dto/enrollment-portal.dto';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}
const runSuite = process.env.DATABASE_URL ? describe : describe.skip;

jest.setTimeout(300000);

function log(msg: string) {
  console.log(`[items7] ${msg}`);
}

async function check(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    log(`PASS ${label}`);
  } catch (err) {
    log(`FAIL ${label} — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

runSuite(
  'Lane 1 item 7 — rejection flow, data-trail guard, write-time state machine (real DB)',
  () => {
    let app: INestApplication;
    let db: DatabaseService;
    let portal: EnrollmentPortalService;
    let registrar: EnrollmentRegistrarService;

    const org = {
      id: `e2e7-org-${uuid()}`,
      slug: `e2e7-${uuid().slice(0, 8)}`,
    };
    const actorId = `e2e7-act-${uuid()}`;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    let sy: { id: string };
    let program: { id: string };
    let level: { id: string };
    let period: { id: string; token: string };

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          CoreModule,
          EnrollmentPortalModule,
          AuthModule,
          AuditLogModule,
          StudentModule,
          StudentEnrollmentModule,
          NotificationModule,
          SchoolYearModule,
        ],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
      db = app.get(DatabaseService);
      portal = app.get(EnrollmentPortalService);
      registrar = app.get(EnrollmentRegistrarService);

      await db.organization.create({
        data: { id: org.id, name: 'E2E Item 7 Org', slug: org.slug },
      });
      sy = await db.schoolYear.create({
        data: {
          org_id: org.id,
          name: `SY ${org.id.slice(0, 6)}`,
          status: 'active',
          start_date: new Date(now - 30 * day),
          end_date: new Date(now + 300 * day),
        },
      });
      program = await db.program.create({
        data: {
          org_id: org.id,
          school_year_id: sy.id,
          name: 'Elementary E2E 7',
          type: 'elementary',
        },
      });
      level = await db.level.create({
        data: {
          org_id: org.id,
          school_year_id: sy.id,
          program_id: program.id,
          name: 'Grade 1',
        },
      });
      period = await db.enrollmentPeriod.create({
        data: {
          org_id: org.id,
          school_year_id: sy.id,
          name: 'E2E Item 7 Period',
          token: `e2e7-${uuid().slice(0, 10)}`,
          start_date: new Date(now - 2 * day),
          lock_date: new Date(now + 5 * day),
          end_date: new Date(now + 5 * day),
          created_by: actorId,
          section_overflow_action: 'no_section',
        },
      });
    }, 120000);

    function sessionFor(email: string): EnrollmentSessionClaims {
      return {
        type: 'enrollment',
        orgId: org.id,
        schoolYearId: sy.id,
        periodId: period.id,
        personalEmail: email,
        applicationId: null,
      };
    }

    function dtoFor(name: string): UpsertEnrollmentApplicationDto {
      return {
        first_name: name.split(' ')[0],
        last_name: name.split(' ')[1] ?? 'Applicant',
        age: 9,
        address: 'Test Address',
        contact_number: '09170000000',
        last_school_graduated: 'Test School',
        program_id: program.id,
        level_id: level.id,
      };
    }

    it('(a) rejected application is committed to the data trail and can never be silently re-placed', async () => {
      return check(
        'item7 (a) rejection data trail + no re-placement',
        async () => {
          const email = `reject-${uuid().slice(0, 8)}@gmail.com`;
          const session = sessionFor(email);

          // Applicant builds a complete application through the portal.
          const created = await portal.createApplication(
            org.slug,
            period.token,
            session,
            dtoFor('Amy Rejected'),
          );
          log(
            `(a) created application ${created.application_code} -> ${created.status}`,
          );
          expect(created.status).toBe('pending');

          // Registrar rejects it with a reason.
          const rejected = await registrar.rejectApplication(
            org.id,
            actorId,
            created.id,
            {
              reason: 'Incomplete documents — missing birth certificate.',
            },
          );
          log(`(a) rejected result status=${rejected.application.status}`);
          expect(rejected.application.status).toBe('rejected');

          // Data trail on the application row itself.
          const row = await db.enrollmentApplication.findUnique({
            where: { id: created.id },
          });
          expect(row?.status).toBe('rejected');
          expect(row?.reviewed_by).toBe(actorId);
          expect(row?.rejection_reason).toBe(
            'Incomplete documents — missing birth certificate.',
          );
          expect(row?.reviewed_at).toBeTruthy();

          // Admin audit record for the rejection.
          const audit = await db.auditLog.findFirst({
            where: {
              org_id: org.id,
              action: 'ENROLLMENT_APPLICATION_REJECT',
              entity_type: 'enrollment_application',
              entity_id: created.id,
            },
          });
          log(`(a) audit: ${audit ? `found id=${audit.id}` : 'MISSING'}`);
          const metadata: any = audit?.metadata ?? null;
          log(`(a) audit metadata: ${JSON.stringify(metadata)}`);
          expect(audit).toBeTruthy();
          expect(metadata?.reason).toBe(
            'Incomplete documents — missing birth certificate.',
          );
          expect(metadata?.personal_email).toBe(email);

          // The SAME applicant tries to re-apply in the same school year.
          await expect(
            portal.createApplication(
              org.slug,
              period.token,
              session,
              dtoFor('Amy Rejected'),
            ),
          ).rejects.toBeInstanceOf(ConflictException);
          log('(a) re-application blocked');
        },
      );
    }, 120000);

    it('(b) the write-time guard is state-based: rejected stays editable, but the review path refuses to approve it', async () => {
      return check('item7 (b) rejected application state machine', async () => {
        const email = `rejected-edit-${uuid().slice(0, 8)}@gmail.com`;
        const session = sessionFor(email);

        const created = await portal.createApplication(
          org.slug,
          period.token,
          session,
          dtoFor('Robert Rejected'),
        );
        await registrar.rejectApplication(org.id, actorId, created.id, {
          reason: 'Duplicate submission.',
        });
        log(`(b) created + rejected (status=rejected)`);

        // updateApplication ONLY blocks locked/approved (service line 236):
        // a rejected application is still editable ...
        const editSession: EnrollmentSessionClaims = {
          ...session,
          applicationId: created.id,
        };
        const updated = await portal.updateApplication(
          org.slug,
          period.token,
          editSession,
          {
            ...dtoFor('Robert Rejected'),
            last_name: 'Rejected-Updated',
          },
        );
        log(`(b) update succeeded, returned last_name=${updated.last_name}`);
        expect(updated.last_name).toBe('Rejected-Updated');

        // ... but the status must NOT be silently flipped back to pending.
        const row = await db.enrollmentApplication.findUnique({
          where: { id: created.id },
        });
        expect(row?.last_name).toBe('Rejected-Updated');
        expect(row?.status).toBe('rejected');
        expect(row?.rejection_reason).toBe('Duplicate submission.');
        log(`(b) status stayed ${row?.status} after edit`);

        // And the REVIEW path refuses to act on a rejected application.
        await expect(
          registrar.approveApplication(org.id, actorId, created.id),
        ).rejects.toBeInstanceOf(ConflictException);
        log('(b) re-approval of rejected application blocked');
      });
    }, 120000);

    afterAll(async () => {
      if (!db) return;
      const step = async (label: string, fn: () => Promise<unknown>) => {
        try {
          await fn();
          log(`cleaned ${label}`);
        } catch (err) {
          log(
            `CLEANUP FAIL @ ${label}: ${err instanceof Error ? err.message : err}`,
          );
        }
      };
      await step('applications', () =>
        db.enrollmentApplication.deleteMany({ where: { org_id: org.id } }),
      );
      await step('student enrollments', () =>
        db.studentProgramEnrollment.deleteMany({ where: { org_id: org.id } }),
      );
      await step('student school-year', () =>
        db.studentSchoolYear.deleteMany({ where: { org_id: org.id } }),
      );
      await step('accounts', () =>
        db.account.deleteMany({ where: { org_id: org.id } }),
      );
      await step('audit logs', () =>
        db.auditLog.deleteMany({ where: { org_id: org.id } }),
      );
      await step('periods', () =>
        db.enrollmentPeriod.deleteMany({ where: { org_id: org.id } }),
      );
      await step('sections', () =>
        db.section.deleteMany({ where: { org_id: org.id } }),
      );
      await step('levels', () =>
        db.level.deleteMany({ where: { org_id: org.id } }),
      );
      await step('programs', () =>
        db.program.deleteMany({ where: { org_id: org.id } }),
      );
      await step('school years', () =>
        db.schoolYear.deleteMany({ where: { org_id: org.id } }),
      );
      await step('organization', () =>
        db.organization.deleteMany({ where: { id: org.id } }),
      );
      await app.close();
    }, 120000);
  },
);
