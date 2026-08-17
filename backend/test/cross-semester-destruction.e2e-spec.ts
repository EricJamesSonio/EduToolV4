// backend/test/cross-semester-destruction.e2e-spec.ts
//
// Lane 1 item 4 — proof test against the REAL database.
//
// Claims under test (expected to FAIL against current code):
//  (A) Seeding a SECOND school year with the SAME structure for the same
//      program produces ZERO ProgramSemesterTermDate rows for that year's
//      assignment (semester-template-seeder.service.ts matching branch
//      upserts the assignment and `continue`s at lines 92-106, so term dates
//      are only ever written in the rebuild branch at 191-194).
//  (B) Seeding a LATER school year with a DIFFERENT break count destroys the
//      FIRST year's ProgramSemesterTermDate rows via the template rebuild
//      cascade (deleteMany on SemesterTemplateItem -> Cascade to
//      SemesterTemplateTerm -> Cascade to ProgramSemesterTermDate), while
//      term ids are org-scoped (seedId omits schoolYearId), so one year's
//      different shape wipes every other year's dates.

import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { OrgSeederModule } from '@/modules/org-seeder/org-seeder.module';
import { DatabaseModule } from '@/core/database/database.module';
import { DatabaseService } from '@/core/database/database.provider';
import { OrgSeederService } from '@/modules/org-seeder/org-seeder.service';
import type { OrgSeedOptions } from '@/modules/org-seeder/seed-context';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
}
const runSuite = process.env.DATABASE_URL ? describe : describe.skip;

const PROGRAM = 'elementary';
const SY1 = { id: `e2e-sy1-${uuid()}`, start: '2026-06-01', end: '2027-03-31' };
const SY2 = { id: `e2e-sy2-${uuid()}`, start: '2027-06-01', end: '2028-03-31' };
const SY3 = { id: `e2e-sy3-${uuid()}`, start: '2028-06-01', end: '2029-03-31' };

// Break spans are computed proportionally within each school year's window so
// they always satisfy ProgramCalendarService.create()'s requirement that every
// break fall inside the calendar range. n breaks => n adjacent, strictly
// separated (1-day gap) periods covering [start, end] exactly, so the calendar
// service's overlap / out-of-range validation can never reject them.
function splitIntoPeriods(
  startDate: string,
  endDate: string,
  periodCount: number,
  prefix: string,
) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const span = end - start;
  const DAY = 24 * 60 * 60 * 1000;
  const entries: { label: string; startDate: string; endDate: string }[] = [];
  for (let i = 0; i < periodCount; i++) {
    const from = new Date(start + (span * i) / periodCount);
    const to = new Date(start + (span * (i + 1)) / periodCount - DAY);
    entries.push({
      label: `${prefix} ${i + 1}`,
      startDate: from.toISOString().slice(0, 10),
      endDate: to.toISOString().slice(0, 10),
    });
  }
  return entries;
}

const twoBreaks = (startDate: string, endDate: string) =>
  splitIntoPeriods(startDate, endDate, 2, 'Sem');

const threeBreaks = (startDate: string, endDate: string) =>
  splitIntoPeriods(startDate, endDate, 3, 'Term');

function seedArgs(
  orgId: string,
  schoolYearId: string,
  actorId: string,
  calendar: {
    startDate: string;
    endDate: string;
    breaks: { label: string; startDate: string; endDate: string }[];
  },
): OrgSeedOptions & { actorId: string } {
  return {
    orgId,
    schoolYearId,
    actorId,
    programs: [PROGRAM],
    seedGradingScales: false,
    seedGradingSchemes: false,
    seedSemesterTemplates: true,
    seedProgramCalendars: true,
    programCalendars: {
      [PROGRAM]: calendar,
    },
  };
}

runSuite('Cross-year semester template destruction (Lane 1 item 4)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let orgSeeder: OrgSeederService;

  const orgId = `e2e-org-${uuid()}`;
  const actorId = `e2e-actor-${uuid()}`;

  const log = (msg: string) => console.log(`[cross-sem] ${msg}`);

  async function findProgramForYear(schoolYearId: string) {
    return db.program.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId, type: PROGRAM },
    });
  }

  async function termDateCountForProgram(
    schoolYearId: string,
  ): Promise<number> {
    const program = await findProgramForYear(schoolYearId);
    if (!program) return -1;
    const assignment = await db.programSemesterAssignment.findUnique({
      where: { program_id: program.id },
    });
    if (!assignment) return -1;
    return db.programSemesterTermDate.count({
      where: { assignment_id: assignment.id },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrgSeederModule, DatabaseModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DatabaseService);
    orgSeeder = app.get(OrgSeederService);

    await db.organization.create({
      data: { id: orgId, name: `E2E Cross-Sem ${orgId}` },
    });
    for (const sy of [SY1, SY2, SY3]) {
      await db.schoolYear.create({
        data: {
          id: sy.id,
          org_id: orgId,
          name: `School Year ${sy.id}`,
          status: 'active',
          start_date: new Date(`${sy.start}T00:00:00.000Z`),
          end_date: new Date(`${sy.end}T00:00:00.000Z`),
        },
      });
    }

    log(`Seeding YEAR 1 (2 breaks, 2026-06 -> 2027-03)`);
    await orgSeeder.seedOrg(
      seedArgs(orgId, SY1.id, actorId, {
        startDate: SY1.start,
        endDate: SY1.end,
        breaks: twoBreaks(SY1.start, SY1.end),
      }),
    );
  }, 180000);

  it('PROOF (A): a structurally-matching SECOND school year produces ZERO term dates for its assignment', async () => {
    const y1Dates = await termDateCountForProgram(SY1.id);
    log(`year1 term dates: ${y1Dates}`);
    expect(y1Dates).toBe(6);

    log(
      `Seeding YEAR 2 (same 2 breaks, 2027-06 -> 2028-03) — structure matches`,
    );
    await orgSeeder.seedOrg(
      seedArgs(orgId, SY2.id, actorId, {
        startDate: SY2.start,
        endDate: SY2.end,
        breaks: twoBreaks(SY2.start, SY2.end),
      }),
    );

    const y2Assignment = await db.programSemesterAssignment.findUnique({
      where: { program_id: (await findProgramForYear(SY2.id))!.id },
    });
    log(`year2 assignment: ${y2Assignment?.id ?? 'MISSING'}`);
    const y2Dates = await termDateCountForProgram(SY2.id);
    log(`year2 term dates: ${y2Dates}`);

    // Correct behavior: a second school year with the same structure must get
    // its own fresh term dates within its own school-year window.
    expect(y2Dates).toBe(6);
  }, 180000);

  it('PROOF (B): a DIFFERENT break count in a later year destroys YEAR 1 term dates via the cascade', async () => {
    const y1Before = await termDateCountForProgram(SY1.id);
    log(`year1 term dates BEFORE year3 seed: ${y1Before}`);
    expect(y1Before).toBe(6); // year 2's matching seed must not have touched them

    log(
      `Seeding YEAR 3 (3 breaks, 2028-06 -> 2029-03) — structure differs, template rebuild`,
    );
    await orgSeeder.seedOrg(
      seedArgs(orgId, SY3.id, actorId, {
        startDate: SY3.start,
        endDate: SY3.end,
        breaks: threeBreaks(SY3.start, SY3.end),
      }),
    );

    const y1After = await termDateCountForProgram(SY1.id);
    log(`year1 term dates AFTER year3 seed: ${y1After}`);

    // Correct behavior: year 1's own term dates must survive whatever year 3
    // decides to do with its own template. The rebuild deletes every term that
    // references the org-scoped template items, and the onDelete: Cascade wipes
    // year 1's ProgramSemesterTermDate rows too.
    expect(y1After).toBe(6);
  }, 180000);

  afterAll(async () => {
    if (!db || !orgId) return;
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

    await step('semester term dates', () =>
      db.programSemesterTermDate.deleteMany({ where: { org_id: orgId } }),
    );
    await step('semester assignments', () =>
      db.programSemesterAssignment.deleteMany({ where: { org_id: orgId } }),
    );
    await step('semester template terms', () =>
      db.semesterTemplateTerm.deleteMany({ where: { org_id: orgId } }),
    );
    await step('semester template items', () =>
      db.semesterTemplateItem.deleteMany({ where: { org_id: orgId } }),
    );
    await step('semester templates', () =>
      db.semesterTemplate.deleteMany({ where: { org_id: orgId } }),
    );
    await step('program calendar holidays', () =>
      db.programCalendarHoliday.deleteMany({ where: { org_id: orgId } }),
    );
    await step('program calendar terms', () =>
      db.programCalendarTerm.deleteMany({ where: { org_id: orgId } }),
    );
    await step('program calendar breaks', () =>
      db.programCalendarBreak.deleteMany({ where: { org_id: orgId } }),
    );
    await step('program calendars', () =>
      db.programCalendar.deleteMany({ where: { org_id: orgId } }),
    );
    await step('subject prerequisites', () =>
      db.subjectPrerequisite.deleteMany({ where: { org_id: orgId } }),
    );
    await step('subject sharings', () =>
      db.subjectSharing.deleteMany({ where: { org_id: orgId } }),
    );
    await step('subjects', () =>
      db.subject.deleteMany({ where: { org_id: orgId } }),
    );
    await step('sections', () =>
      db.section.deleteMany({ where: { org_id: orgId } }),
    );
    await step('levels', () =>
      db.level.deleteMany({ where: { org_id: orgId } }),
    );
    await step('strands', () =>
      db.strand.deleteMany({ where: { org_id: orgId } }),
    );
    await step('courses', () =>
      db.course.deleteMany({ where: { org_id: orgId } }),
    );
    await step('programs', () =>
      db.program.deleteMany({ where: { org_id: orgId } }),
    );
    await step('grading scale assignments', () =>
      db.gradingScaleAssignment.deleteMany({ where: { org_id: orgId } }),
    );
    await step('grading scales', () =>
      db.gradingScale.deleteMany({ where: { org_id: orgId } }),
    );
    await step('grading scheme components', () =>
      db.gradingSchemeTemplateComponent.deleteMany({
        where: { org_id: orgId },
      }),
    );
    await step('grading scheme templates', () =>
      db.gradingSchemeTemplate.deleteMany({ where: { org_id: orgId } }),
    );
    await step('concern categories', () =>
      db.concernCategory.deleteMany({ where: { org_id: orgId } }),
    );
    await step('org concern settings', () =>
      db.orgConcernSetting.deleteMany({ where: { org_id: orgId } }),
    );
    await step('org enrollment settings', () =>
      db.orgEnrollmentSetting.deleteMany({ where: { org_id: orgId } }),
    );
    await step('audit logs', () =>
      db.auditLog.deleteMany({ where: { org_id: orgId } }),
    );
    await step('school years', () =>
      db.schoolYear.deleteMany({ where: { org_id: orgId } }),
    );
    await step('organization', () =>
      db.organization.deleteMany({ where: { id: orgId } }),
    );
    await app.close();
  }, 90000);
});
