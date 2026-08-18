// backend/test/lane1-item9-enrollment-auto-unenroll.e2e-spec.ts
//
// Lane 1 item 9 — proof tests against the REAL database for "auto unenroll when
// the school year ends":
//  (a) the nightly scheduler task (SchedulerTasks.handleAutoUnenrollOnYearEnd)
//      removes active class enrollments and unenrolls StudentSchoolYear rows for
//      an EXPIRED active school year, then marks the year `ended`;
//  (b) that sweep respects the org's auto_unenroll_on_year_end setting
//      (disabled → enrollments are preserved while the year still ends);
//  (c) the admin SchoolYearService.end() performs the same scrub
//      unconditionally, and its guards reject a pending year (400), an already
//      ended year (409), and a missing year (404).

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { CoreModule } from '@/core/core.module';
import { SchoolYearModule } from '@/modules/school-year/school-year.module';
import { OrgEnrollmentSettingModule } from '@/modules/org-enrollment-setting/org-enrollment-setting.module';
import { DatabaseService } from '@/core/database/database.provider';
import { SchedulerTasks } from '@/core/scheduler/scheduler.tasks';
import { SchoolYearService } from '@/modules/school-year/school-year.service';
import { OrgEnrollmentSettingService } from '@/modules/org-enrollment-setting/org-enrollment-setting.service';
import { genEmail, genId, genPrefixedId, genSlug } from './utils/id.util';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}
const runSuite = process.env.DATABASE_URL ? describe : describe.skip;

jest.setTimeout(300000);

function log(msg: string) {
  console.log(`[item9] ${msg}`);
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
  'Lane 1 item 9 — auto-unenroll when the school year ends (real DB)',
  () => {
    let app: INestApplication;
    let db: DatabaseService;
    let scheduler: SchedulerTasks;
    let schoolYearService: SchoolYearService;
    let orgSettingService: OrgEnrollmentSettingService;

    const orgA = {
      id: genPrefixedId('e2e9a-org'),
      slug: genSlug('e2e9a'),
    };
    const orgB = {
      id: genPrefixedId('e2e9b-org'),
      slug: genSlug('e2e9b'),
    };
    const orgC = {
      id: genPrefixedId('e2e9c-org'),
      slug: genSlug('e2e9c'),
    };
    const actorId = genPrefixedId('e2e9-act');

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    async function orgWithExpiredYear(
      org: { id: string; slug: string },
      name: string,
      status: 'active' | 'pending' | 'ended' = 'active',
    ) {
      await db.organization.create({
        data: { id: org.id, name, slug: org.slug },
      });
      return db.schoolYear.create({
        data: {
          org_id: org.id,
          name: `SY ${org.id.slice(0, 6)}`,
          status,
          start_date: new Date(now - 30 * day),
          end_date: new Date(now - 1 * day),
        },
      });
    }

    // Minimal but complete academic tree: program → level → subject → semester →
    // class (educator + semester are required FKs on Class).
    async function classFixture(orgId: string, syId: string) {
      const program = await db.program.create({
        data: {
          org_id: orgId,
          school_year_id: syId,
          name: 'JHS Item9',
          type: 'jhs',
        },
      });
      const level = await db.level.create({
        data: {
          org_id: orgId,
          school_year_id: syId,
          program_id: program.id,
          name: 'Grade 7',
        },
      });
      const subject = await db.subject.create({
        data: {
          org_id: orgId,
          name: genPrefixedId('Subject'),
          subject_type: 'minor',
          program_id: program.id,
          level_id: level.id,
        },
      });
      const semester = await db.semester.create({
        data: {
          org_id: orgId,
          school_year_id: syId,
          name: '1st Semester',
          start_date: new Date(now - 10 * day),
          end_date: new Date(now + 10 * day),
        },
      });
      const educator = await db.account.create({
        data: {
          org_id: orgId,
          role: 'educator',
          email: genEmail(`edu-${orgId.slice(0, 6)}`),
          password: 'x',
          status: 'active',
        },
      });
      const cls = await db.class.create({
        data: {
          org_id: orgId,
          subject_id: subject.id,
          educator_id: educator.id,
          school_year_id: syId,
          semester_id: semester.id,
          capacity: 40,
        },
      });
      return { classId: cls.id };
    }

    async function activeClassEnrollment(
      orgId: string,
      syId: string,
      classId: string,
      tag: string,
    ) {
      const student = await db.account.create({
        data: {
          org_id: orgId,
          role: 'student',
          email: genEmail(`stu-${tag}-${orgId.slice(0, 6)}`),
          password: 'x',
          status: 'active',
        },
      });
      const ssy = await db.studentSchoolYear.create({
        data: {
          org_id: orgId,
          student_id: student.id,
          school_year_id: syId,
          status: 'active',
        },
      });
      const enrollment = await db.enrollment.create({
        data: {
          org_id: orgId,
          class_id: classId,
          student_id: student.id,
          status: 'active',
        },
      });
      return {
        studentId: student.id,
        ssyId: ssy.id,
        enrollmentId: enrollment.id,
      };
    }

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [CoreModule, SchoolYearModule, OrgEnrollmentSettingModule],
        providers: [
          // The scheduler task only touches `db` + `orgEnrollmentSettingService`
          // on the year-end path, so the remaining deps can stay unneeded.
          {
            provide: SchedulerTasks,
            useFactory: (
              db_: DatabaseService,
              orgSetting: OrgEnrollmentSettingService,
            ) =>
              new SchedulerTasks(
                null as never,
                null as never,
                null as never,
                orgSetting,
                null as never,
                db_,
                null as never,
              ),
            inject: [DatabaseService, OrgEnrollmentSettingService],
          },
        ],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
      db = app.get(DatabaseService);
      scheduler = app.get(SchedulerTasks);
      schoolYearService = app.get(SchoolYearService);
      orgSettingService = app.get(OrgEnrollmentSettingService);
    }, 120000);

    it('(a) cron unenrolls class enrollments + students for an expired active year', async () => {
      return check(
        'item9 (a) scheduler auto-unenroll on year end',
        async () => {
          const sy = await orgWithExpiredYear(orgA, 'Item9a Org');
          const cls = await classFixture(orgA.id, sy.id);
          const enr = await activeClassEnrollment(
            orgA.id,
            sy.id,
            cls.classId,
            'a',
          );

          await scheduler.handleAutoUnenrollOnYearEnd();

          const yearAfter = await db.schoolYear.findUnique({
            where: { id: sy.id },
          });
          expect(yearAfter?.status).toBe('ended');

          const enrollmentAfter = await db.enrollment.findUnique({
            where: { id: enr.enrollmentId },
          });
          expect(enrollmentAfter?.status).toBe('removed');

          const ssyAfter = await db.studentSchoolYear.findUnique({
            where: { id: enr.ssyId },
          });
          expect(ssyAfter?.status).toBe('unenrolled');
          expect(ssyAfter?.unenrolled_at).not.toBeNull();
        },
      );
    }, 120000);

    it('(b) org setting auto_unenroll_on_year_end=false preserves enrollments (year still ends)', async () => {
      return check(
        'item9 (b) disabled auto-unenroll setting respected',
        async () => {
          const sy = await orgWithExpiredYear(orgB, 'Item9b Org');
          const cls = await classFixture(orgB.id, sy.id);
          const enr = await activeClassEnrollment(
            orgB.id,
            sy.id,
            cls.classId,
            'b',
          );
          await orgSettingService.upsert(orgB.id, {
            auto_unenroll_on_year_end: false,
          });

          await scheduler.handleAutoUnenrollOnYearEnd();

          const yearAfter = await db.schoolYear.findUnique({
            where: { id: sy.id },
          });
          expect(yearAfter?.status).toBe('ended');

          const enrollmentAfter = await db.enrollment.findUnique({
            where: { id: enr.enrollmentId },
          });
          expect(enrollmentAfter?.status).toBe('active');

          const ssyAfter = await db.studentSchoolYear.findUnique({
            where: { id: enr.ssyId },
          });
          expect(ssyAfter?.status).toBe('active');
        },
      );
    }, 120000);

    it('(c) SchoolYearService.end() scrubs enrollments unconditionally and its guards hold', async () => {
      return check('item9 (c) admin end() scrub + guards', async () => {
        const sy = await orgWithExpiredYear(orgC, 'Item9c Org');
        const cls = await classFixture(orgC.id, sy.id);
        const enr = await activeClassEnrollment(
          orgC.id,
          sy.id,
          cls.classId,
          'c',
        );

        await schoolYearService.end(sy.id, orgC.id, actorId);

        const yearAfter = await db.schoolYear.findUnique({
          where: { id: sy.id },
        });
        expect(yearAfter?.status).toBe('ended');
        const enrollmentAfter = await db.enrollment.findUnique({
          where: { id: enr.enrollmentId },
        });
        expect(enrollmentAfter?.status).toBe('removed');
        const ssyAfter = await db.studentSchoolYear.findUnique({
          where: { id: enr.ssyId },
        });
        expect(ssyAfter?.status).toBe('unenrolled');

        // Guards: pending year, already-ended year, missing year.
        const pendingSy = await db.schoolYear.create({
          data: {
            org_id: orgC.id,
            name: 'SY pending',
            status: 'pending',
            start_date: new Date(now - 5 * day),
            end_date: new Date(now + 300 * day),
          },
        });
        await expect(
          schoolYearService.end(pendingSy.id, orgC.id, actorId),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(
          schoolYearService.end(sy.id, orgC.id, actorId),
        ).rejects.toBeInstanceOf(ConflictException);
        await expect(
          schoolYearService.end(genId(), orgC.id, actorId),
        ).rejects.toBeInstanceOf(NotFoundException);
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
      for (const org of [orgA, orgB, orgC]) {
        await step(`org ${org.id} enrollments`, () =>
          db.enrollment.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} class schedules`, () =>
          db.classSchedule.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} classes`, () =>
          db.class.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} semesters`, () =>
          db.semester.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} subjects`, () =>
          db.subject.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} program enrollments`, () =>
          db.studentProgramEnrollment.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} school-year enrollments`, () =>
          db.studentSchoolYear.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} accounts`, () =>
          db.account.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} audit logs`, () =>
          db.auditLog.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} enrollment settings`, () =>
          db.orgEnrollmentSetting.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} levels`, () =>
          db.level.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} programs`, () =>
          db.program.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} school years`, () =>
          db.schoolYear.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id}`, () =>
          db.organization.deleteMany({ where: { id: org.id } }),
        );
      }
      await app.close();
    }, 120000);
  },
);
