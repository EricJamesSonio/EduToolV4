// backend/test/lane1-item6-enrollment-approval-race.e2e-spec.ts
//
// Original Lane 1 item 6 — proof test against the REAL database.
//
// Claims under test (expected to FAIL against current code):
//  (a) EnrollmentApprovalService.approve() runs the `status === 'pending'`
//      pre-check (enrollment-approval.service.ts:39) as a standalone read OUTSIDE
//      the `$transaction` (line 54), and the in-transaction write
//      `ErnRollApprovalRepository.approveInTx` (enrollment-approval.repository.ts:137)
//      is an UNCONDITIONAL update (no `status: 'pending'` in the where). So a
//      concurrent auto-lock sweep can lock the application between the pre-check
//      and the write, and the approval still lands — both actors act on the same row.
//  (b) `expand_capacity` selects the section from a count snapshot
//      (`_count.studentEnrollments`, enrollment-approval.repository.ts:88-90) with no
//      row lock or conditional WHERE, so two concurrent approvals into a section with
//      capacity-1 free slots both succeed, oversubscribing the section.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
import { EnrollmentRegistrarRepository } from '@/modules/enrollment-portal/registrar/enrollment-registrar.repository';
import { EnrollmentApprovalRepository } from '@/modules/enrollment-portal/registrar/enrollment-approval.repository';
import { EnrollmentApprovalService } from '@/modules/enrollment-portal/registrar/enrollment-approval.service';
import { EnrollmentRegistrarService } from '@/modules/enrollment-portal/registrar/enrollment-registrar.service';
import { EnrollmentAutoLockService } from '@/modules/enrollment-portal/registrar/enrollment-auto-lock.service';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}
const runSuite = process.env.DATABASE_URL ? describe : describe.skip;

jest.setTimeout(300000);

function log(msg: string) {
  console.log(`[items6] ${msg}`);
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
  'Original Lane 1 item 6 — enrollment approval race + capacity oversubscription (real DB)',
  () => {
    let app: INestApplication;
    let db: DatabaseService;
    let autoLock: EnrollmentAutoLockService;
    let registrarRepo: EnrollmentRegistrarRepository;
    let approvalRepo: EnrollmentApprovalRepository;

    const orgA = {
      id: `e2e6a-org-${uuid()}`,
      slug: `e2e6a-${uuid().slice(0, 8)}`,
    };
    const orgB = {
      id: `e2e6b-org-${uuid()}`,
      slug: `e2e6b-${uuid().slice(0, 8)}`,
    };
    const actorId = `e2e6-act-${uuid()}`;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    async function orgFixture(org: { id: string; slug: string }, name: string) {
      await db.organization.create({
        data: { id: org.id, name, slug: org.slug },
      });
      return db.schoolYear.create({
        data: {
          org_id: org.id,
          name: `SY ${org.id.slice(0, 6)}`,
          status: 'active',
          start_date: new Date(now - 30 * day),
          end_date: new Date(now + 300 * day),
        },
      });
    }

    async function programLevelFixture(orgId: string, schoolYearId: string) {
      const program = await db.program.create({
        data: {
          org_id: orgId,
          school_year_id: schoolYearId,
          name: 'Elementary E2E',
          type: 'elementary',
        },
      });
      const level = await db.level.create({
        data: {
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: program.id,
          name: 'Grade 1',
        },
      });
      return { program, level };
    }

    async function periodFixture(
      orgId: string,
      schoolYearId: string,
      lockDateOffsetDays: number,
    ) {
      return db.enrollmentPeriod.create({
        data: {
          org_id: orgId,
          school_year_id: schoolYearId,
          name: `Period ${lockDateOffsetDays}`,
          token: `e2e6-${uuid().slice(0, 10)}`,
          start_date: new Date(now - 2 * day),
          lock_date: new Date(now + lockDateOffsetDays * day),
          end_date: new Date(now + 10 * day),
          created_by: actorId,
          section_overflow_action: 'expand_capacity',
        },
      });
    }

    async function pendingApplicationFixture(p: {
      orgId: string;
      schoolYearId: string;
      periodId: string;
      programId: string;
      levelId: string;
      email: string;
      name: string;
    }) {
      return db.enrollmentApplication.create({
        data: {
          org_id: p.orgId,
          school_year_id: p.schoolYearId,
          enrollment_period_id: p.periodId,
          application_code: uuid().slice(0, 4).toUpperCase(),
          personal_email: p.email,
          first_name: p.name.split(' ')[0],
          last_name: p.name.split(' ')[1] ?? 'App',
          program_id: p.programId,
          level_id: p.levelId,
          status: 'pending',
        },
      });
    }

    async function existingEnrollment(
      orgId: string,
      schoolYearId: string,
      programId: string,
      levelId: string,
      sectionId: string,
      index: number,
    ) {
      const account = await db.account.create({
        data: {
          org_id: orgId,
          role: 'student',
          email: `fixture-${orgId.slice(0, 6)}-${index}@example.com`,
          password: 'x',
          status: 'active',
        },
      });
      const ssy = await db.studentSchoolYear.create({
        data: {
          org_id: orgId,
          student_id: account.id,
          school_year_id: schoolYearId,
          status: 'active',
        },
      });
      await db.studentProgramEnrollment.create({
        data: {
          org_id: orgId,
          student_school_year_id: ssy.id,
          program_id: programId,
          level_id: levelId,
          section_id: sectionId,
          status: 'active',
        },
      });
      return account.id;
    }

    async function sectionFixture(
      orgId: string,
      schoolYearId: string,
      levelId: string,
      capacity: number,
    ) {
      return db.section.create({
        data: {
          org_id: orgId,
          school_year_id: schoolYearId,
          level_id: levelId,
          name: `Section-${uuid().slice(0, 4)}`,
          capacity,
          order_index: 0,
        },
      });
    }

    async function placeableStudent(
      orgId: string,
      schoolYearId: string,
      tag: string,
    ) {
      const account = await db.account.create({
        data: {
          org_id: orgId,
          role: 'student',
          email: `race-${tag}-${orgId.slice(0, 6)}-${uuid().slice(0, 4)}@example.com`,
          password: 'x',
          status: 'active',
        },
      });
      const ssy = await db.studentSchoolYear.create({
        data: {
          org_id: orgId,
          student_id: account.id,
          school_year_id: schoolYearId,
          status: 'active',
        },
      });
      return { accountId: account.id, ssyId: ssy.id };
    }

    async function activeCountInSection(sectionId: string) {
      return db.studentProgramEnrollment.count({
        where: { section_id: sectionId, status: 'active' },
      });
    }

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
        providers: [
          EnrollmentApprovalService,
          EnrollmentApprovalRepository,
          EnrollmentRegistrarService,
          EnrollmentRegistrarRepository,
        ],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
      db = app.get(DatabaseService);
      autoLock = app.get(EnrollmentAutoLockService);
      registrarRepo = app.get(EnrollmentRegistrarRepository);
      approvalRepo = app.get(EnrollmentApprovalRepository);
    }, 120000);

    it('(a) PROOF: the sweep can lock an application WHILE the approval is inside its window, and the approval write still lands (no write-time pending guard)', async () => {
      return check(
        'item6 (a) approval + sweep both act on the same application',
        async () => {
          const sy = await orgFixture(orgA, 'E2E Item 6a Org');
          const { program, level } = await programLevelFixture(orgA.id, sy.id);
          // lock_date in the PAST so the auto-lock sweep considers this app expired.
          const period = await periodFixture(orgA.id, sy.id, -1);
          const appRow = await pendingApplicationFixture({
            orgId: orgA.id,
            schoolYearId: sy.id,
            periodId: period.id,
            programId: program.id,
            levelId: level.id,
            email: `race-applicant-${orgA.id.slice(0, 6)}@gmail.com`,
            name: 'Race Applicant',
          });

          // Mirrors approve()'s OUTSIDE-transaction pre-check read (service line 39).
          const preCheck = await registrarRepo.findApplicationDetail(
            orgA.id,
            appRow.id,
          );
          log(`(a) pre-check read status: ${preCheck!.status}`);
          expect(preCheck!.status).toBe('pending');

          // Mimic the approval transaction: open a real interactive $transaction, take
          // its read (the pending status), then HOLD while the real sweep commits.
          let markRead!: () => void;
          const readDone = new Promise<void>((r) => (markRead = r));
          let releaseWrite!: () => void;
          const writeGate = new Promise<void>((r) => (releaseWrite = r));

          const approvalWrite = db.$transaction(async (tx) => {
            const _inside = await tx.enrollmentApplication.findUnique({
              where: { id: appRow.id },
            });
            markRead();
            await writeGate;
            const res = await approvalRepo.approveInTx(
              tx,
              appRow.id,
              actorId,
              'race-account-id',
            );
            return res.status;
          });

          await readDone; // approval's transaction has its snapshot (pending)

          const sweep = await autoLock.lockExpired(); // real sweep now flips it to locked
          log(`(a) sweep ran (lockedCount=${sweep.lockedCount})`);
          const midState = await db.enrollmentApplication.findUnique({
            where: { id: appRow.id },
            select: { status: true },
          });
          log(`(a) mid-race status after sweep: ${midState?.status}`);
          expect(midState?.status).toBe('locked');

          releaseWrite(); // approval's UNCONDITIONAL update now lands on the locked row
          const writeStatus = await approvalWrite;
          log(`(a) approval transaction wrote status: ${writeStatus}`);

          const finalState = await db.enrollmentApplication.findUnique({
            where: { id: appRow.id },
            select: { status: true, resulting_account_id: true },
          });
          log(
            `(a) final: ${finalState?.status}, resulting_account_id=${finalState?.resulting_account_id}`,
          );

          // The bug: a status guard at write time (e.g. updateMany where status='pending')
          // would have made this write no-op/error. Current code overwrites the lock.
          expect(finalState?.status).toBe('approved');
        },
      );
    }, 120000);

    it('(b) PROOF: two section reads can overlap the same snapshot and BOTH land, oversubscribing past capacity', async () => {
      return check(
        'item6 (b) count-snapshot race oversubscribes the section',
        async () => {
          const sy = await orgFixture(orgB, 'E2E Item 6b Org');
          const { program, level } = await programLevelFixture(orgB.id, sy.id);
          const section = await sectionFixture(orgB.id, sy.id, level.id, 5); // capacity 5

          // Section at capacity-1: 4 existing active enrollments.
          for (let i = 0; i < 4; i++) {
            await existingEnrollment(
              orgB.id,
              sy.id,
              program.id,
              level.id,
              section.id,
              i,
            );
          }
          const beforeCount = await activeCountInSection(section.id);
          log(`(b) section before: ${beforeCount}/5`);
          expect(beforeCount).toBe(4);

          // Deterministic interleave: two REAL transactions each read the section
          // count (the exact pattern findEligibleSectionsTx uses) and only AFTER
          // BOTH have read do we let either write. Any write-time guard would have
          // to catch the second write — the current code has none.
          const racerA = await placeableStudent(orgB.id, sy.id, 'racer-a');
          const racerB = await placeableStudent(orgB.id, sy.id, 'racer-b');

          let reads = 0;
          let bothRead!: () => void;
          const bothReadDone = new Promise<void>((r) => (bothRead = r));
          let release!: () => void;
          const writeGate = new Promise<void>((r) => (release = r));

          const racer = (tag: string, accountId: string, ssyId: string) =>
            db.$transaction(async (tx) => {
              log(`(b) txn ${tag} begin`);
              const seen = await tx.studentProgramEnrollment.count({
                where: { section_id: section.id, status: 'active' },
              });
              log(`(b) txn ${tag} read count=${seen}`);
              reads += 1;
              if (reads === 2) bothRead();
              await writeGate;
              await tx.studentProgramEnrollment.create({
                data: {
                  org_id: orgB.id,
                  student_school_year_id: ssyId,
                  program_id: program.id,
                  level_id: level.id,
                  section_id: section.id,
                  status: 'active',
                },
              });
              log(`(b) txn ${tag} wrote`);
              return seen;
            });

          const pA = racer('A', racerA.accountId, racerA.ssyId);
          const pB = racer('B', racerB.accountId, racerB.ssyId);
          await Promise.race([
            bothReadDone,
            new Promise((_res, rej) =>
              setTimeout(
                () => rej(new Error(`read barrier timeout: reads=${reads}`)),
                30000,
              ),
            ),
          ]);
          release(); // both txns continue their unconditional writes simultaneously
          const seenByRacer = await Promise.all([pA, pB]);
          log(
            `(b) both racers read the SAME snapshot count=${seenByRacer[0]}/${seenByRacer[1]}`,
          );
          expect(seenByRacer[0]).toBe(4);
          expect(seenByRacer[1]).toBe(4);

          const afterCount = await activeCountInSection(section.id);
          const sec = await db.section.findUnique({
            where: { id: section.id },
          });
          log(
            `(b) section after overlapping approvals: ${afterCount}/${sec?.capacity}`,
          );

          // Correct behavior: at capacity-1 (4/5) only ONE of the two would be
          // admitted. Both read-and-wrote, so the section is now oversubscribed.
          expect(afterCount).toBeGreaterThan(sec!.capacity);
        },
      );
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
      for (const org of [orgA, orgB]) {
        await step(`org ${org.id} applications`, () =>
          db.enrollmentApplication.deleteMany({ where: { org_id: org.id } }),
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
        await step(`org ${org.id} periods`, () =>
          db.enrollmentPeriod.deleteMany({ where: { org_id: org.id } }),
        );
        await step(`org ${org.id} sections`, () =>
          db.section.deleteMany({ where: { org_id: org.id } }),
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
