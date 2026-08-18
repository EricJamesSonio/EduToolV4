// backend/test/lane1-item8-cross-sy-semester-template.e2e-spec.ts
//
// Lane 1 item 8 — proof tests against the REAL database.
//
// A single semester template assigned to two different programs that live in
// two different SCHOOL YEARS must materialize per-school-year component rows:
//
//  (a) each program's assignment points at the same template, and each
//      assignment carries its OWN term-date mapping (isolated per assignment);
//  (b) the same template term name (e.g. "1st Semester" / "Term 1") yields
//      DISTINCT `Semester`/`Term` rows scoped to each program's school year —
//      the dates of program A's scope do NOT leak into program B's scope, so a
//      cross-school-year "collision" (which an org-wide or template-scoped key
//      would have produced) cannot occur.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CoreModule } from '@/core/core.module';
import { SemesterTemplateModule } from '@/modules/semester-template/semester-template.module';
import { SemesterTemplateService } from '@/modules/semester-template/semester-template.service';
import { SemesterTemplateRepository } from '@/modules/semester-template/semester-template.repository';
import { DatabaseService } from '@/core/database/database.provider';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}
const runSuite = process.env.DATABASE_URL ? describe : describe.skip;

jest.setTimeout(300000);

function log(msg: string) {
  console.log(`[items8] ${msg}`);
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

const localDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

runSuite(
  'Lane 1 item 8 — cross-school-year semester template (real DB)',
  () => {
    let app: INestApplication;
    let db: DatabaseService;
    let templateService: SemesterTemplateService;
    let templateRepo: SemesterTemplateRepository;

    const org = {
      id: `e2e8-org-${uuid()}`,
      slug: `e2e8-${uuid().slice(0, 8)}`,
    };

    let syA: { id: string };
    let syB: { id: string };
    let programA: { id: string };
    let programB: { id: string };

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [CoreModule, SemesterTemplateModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
      db = app.get(DatabaseService);
      templateService = app.get(SemesterTemplateService);
      templateRepo = app.get(SemesterTemplateRepository);

      await db.organization.create({
        data: { id: org.id, name: 'E2E Item 8 Org', slug: org.slug },
      });

      syA = await db.schoolYear.create({
        data: {
          org_id: org.id,
          name: `SY-A ${org.id.slice(0, 6)}`,
          status: 'active',
          start_date: new Date('2026-06-01'),
          end_date: new Date('2027-03-31'),
        },
      });
      syB = await db.schoolYear.create({
        data: {
          org_id: org.id,
          name: `SY-B ${org.id.slice(0, 6)}`,
          status: 'active',
          start_date: new Date('2026-06-01'),
          end_date: new Date('2027-03-31'),
        },
      });

      programA = await db.program.create({
        data: {
          org_id: org.id,
          school_year_id: syA.id,
          name: 'Program A (SYA)',
          type: 'elementary',
        },
      });
      programB = await db.program.create({
        data: {
          org_id: org.id,
          school_year_id: syB.id,
          name: 'Program B (SYB)',
          type: 'elementary',
        },
      });
    }, 120000);

    it('(a) one template assigned to two programs keeps each assignment’s term dates isolated', async () => {
      return check(
        'item8 (a) assignment + per-assignment term-date isolation',
        async () => {
          const template = await templateService.create(org.id, {
            name: `E2E-${org.id.slice(0, 6)} Template`,
            programType: 'elementary',
            semesters: [
              {
                name: '1st Semester',
                orderIndex: 1,
                terms: [
                  { name: 'Term 1', orderIndex: 1 },
                  { name: 'Term 2', orderIndex: 2 },
                ],
              },
              {
                name: '2nd Semester',
                orderIndex: 2,
                terms: [{ name: 'Term 3', orderIndex: 1 }],
              },
            ],
          });
          const s1 = template.semesters[0];
          const s2 = template.semesters[1];
          const termT1 = s1.terms[0].id;
          const termT2 = s1.terms[1].id;
          const termT3 = s2.terms[0].id;
          log(
            `(a) template ${template.id} semesters=${template.semesters.length}`,
          );

          // Assign the SAME template to programA (SY A) and programB (SY B).
          await templateRepo.assignToProgram({
            orgId: org.id,
            programId: programA.id,
            templateId: template.id,
          });
          await templateRepo.assignToProgram({
            orgId: org.id,
            programId: programB.id,
            templateId: template.id,
          });

          const assA = await templateRepo.findAssignmentByProgram(
            programA.id,
            org.id,
          );
          const assB = await templateRepo.findAssignmentByProgram(
            programB.id,
            org.id,
          );
          expect(assA?.template_id).toBe(template.id);
          expect(assB?.template_id).toBe(template.id);
          expect(assA?.id).not.toBe(assB?.id);

          // Different calendars for the two school years.
          await templateService.saveTermDates(org.id, programA.id, [
            { termId: termT1, startDate: '2026-06-01', endDate: '2026-12-15' },
            { termId: termT2, startDate: '2027-01-04', endDate: '2027-02-10' },
            { termId: termT3, startDate: '2027-02-15', endDate: '2027-03-26' },
          ]);
          await templateService.saveTermDates(org.id, programB.id, [
            { termId: termT1, startDate: '2026-06-10', endDate: '2026-12-20' },
            { termId: termT2, startDate: '2027-01-10', endDate: '2027-02-20' },
            { termId: termT3, startDate: '2027-03-01', endDate: '2027-03-31' },
          ]);

          // Per-assignment term dates must differ (isolation).
          const datesA = await db.programSemesterTermDate.findMany({
            where: { assignment_id: assA!.id },
            orderBy: { start_date: 'asc' },
          });
          const datesB = await db.programSemesterTermDate.findMany({
            where: { assignment_id: assB!.id },
            orderBy: { start_date: 'asc' },
          });
          log(
            `(a) SYA term-date starts: ${datesA.map((d) => localDate(d.start_date)).join(',')} | ` +
              `SYB: ${datesB.map((d) => localDate(d.start_date)).join(',')}`,
          );
          expect(datesA.length).toBe(3);
          expect(datesB.length).toBe(3);
          expect(localDate(datesA[0].start_date)).toBe('2026-06-01');
          expect(localDate(datesB[0].start_date)).toBe('2026-06-10');
          expect(localDate(datesA[0].start_date)).not.toBe(
            localDate(datesB[0].start_date),
          );
        },
      );
    }, 120000);

    it('(b) same-named component rows are scoped per school year — no cross-SY leak', async () => {
      return check(
        'item8 (b) school-year isolation of component rows',
        async () => {
          // Two Semester rows named "1st Semester" must exist — one per school year.
          const firstSemesters = await db.semester.findMany({
            where: { org_id: org.id, name: '1st Semester' },
            orderBy: { school_year_id: 'asc' },
            include: { terms: { orderBy: { order_index: 'asc' as const } } },
          });
          log(
            `(b) "1st Semester" rows: ${firstSemesters.length} -> ` +
              firstSemesters
                .map(
                  (s) =>
                    `${s.school_year_id.slice(0, 6)}=${localDate(s.start_date)}..${localDate(s.end_date)}`,
                )
                .join(' | '),
          );
          expect(firstSemesters.length).toBe(2);

          const semA = firstSemesters.find((s) => s.school_year_id === syA.id);
          const semB = firstSemesters.find((s) => s.school_year_id === syB.id);
          expect(semA).toBeTruthy();
          expect(semB).toBeTruthy();

          // Component dates come from the program’s OWN calendar, not the template’s.
          expect(localDate(semA!.start_date)).toBe('2026-06-01');
          expect(localDate(semA!.end_date)).toBe('2027-02-10');
          expect(localDate(semB!.start_date)).toBe('2026-06-10');
          expect(localDate(semB!.end_date)).toBe('2027-02-20');
          expect(localDate(semA!.start_date)).not.toBe(
            localDate(semB!.start_date),
          );

          // The same term name also resolves to the correct per-SY dates.
          const termA1 = semA!.terms.find((t) => t.name === 'Term 1');
          const termB1 = semB!.terms.find((t) => t.name === 'Term 1');
          expect(termA1).toBeTruthy();
          expect(termB1).toBeTruthy();
          expect(localDate(termA1!.start_date)).toBe('2026-06-01');
          expect(localDate(termB1!.start_date)).toBe('2026-06-10');

          // Full cross-reference sweep: EVERY component row under this org belongs to
          // one of the two school years (no dangling org-wide/unscoped rows).
          // The template defines 2 semesters, so we expect 2 SYs × 2 names = 4 rows,
          // all scoped to either SYA or SYB.
          const allSemesters = await db.semester.findMany({
            where: { org_id: org.id },
            select: { school_year_id: true },
          });
          expect(allSemesters.length).toBe(4);
          for (const s of allSemesters) {
            expect([syA.id, syB.id]).toContain(s.school_year_id);
          }
          log('(b) all component rows correctly scoped to SYA/SYB');
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
      await step('program term dates', () =>
        db.programSemesterTermDate.deleteMany({ where: { org_id: org.id } }),
      );
      await step('program assignments', () =>
        db.programSemesterAssignment.deleteMany({ where: { org_id: org.id } }),
      );
      await step('terms', () =>
        db.term.deleteMany({ where: { org_id: org.id } }),
      );
      await step('semesters', () =>
        db.semester.deleteMany({ where: { org_id: org.id } }),
      );
      await step('template terms', () =>
        db.semesterTemplateTerm.deleteMany({ where: { org_id: org.id } }),
      );
      await step('template items', () =>
        db.semesterTemplateItem.deleteMany({ where: { org_id: org.id } }),
      );
      await step('templates', () =>
        db.semesterTemplate.deleteMany({ where: { org_id: org.id } }),
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
