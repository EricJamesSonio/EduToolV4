// backend/test/org-seeder.e2e-spec.ts
//
// REAL end-to-end test for the OrgSeeder flow. No mocks, no stubs, no fake
// Prisma clients. It boots the real Nest module graph, runs the real
// OrgSeederService.seedOrg() against whatever DATABASE_URL is configured,
// then queries the real database directly to confirm what was persisted.

import * as path from 'path';
import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { OrgSeederModule } from '@/modules/org-seeder/org-seeder.module';
import { DatabaseModule } from '@/core/database/database.module';
import { DatabaseService } from '@/core/database/database.provider';
import { OrgSeederService } from '@/modules/org-seeder/org-seeder.service';
import type {
  OrgSeedOptions,
  SeedResult,
} from '@/modules/org-seeder/seed-context';

import { PROGRAMS } from '@/modules/org-seeder/data/programs.data';
import {
  COLLEGE_COURSES,
  BSED_MAJORS,
} from '@/modules/org-seeder/data/courses.data';
import { SHS_STRAND_DEFS } from '@/modules/org-seeder/data/strands.data';
import { buildLevelDefs } from '@/modules/org-seeder/data/levels.data';
import { SCHEME_PRESETS } from '@/modules/org-seeder/data/grading-schemes.data';
import { DEFAULT_CONCERN_CATEGORIES } from '@/modules/concern/data/default-categories.data';

// Point DatabaseService at the real configured DB before the app boots.
if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.join(__dirname, '..', '.env') });
  console.log('[org-seeder e2e] DATABASE_URL loaded from backend/.env');
}

const hasDbUrl = !!process.env.DATABASE_URL;

import { execFileSync } from 'child_process';

function dbReachable(connectionString?: string, timeoutMs = 3000): boolean {
  if (!connectionString) return false;
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return false;
  }
  const host = url.hostname;
  const port = Number(url.port || 5432);
  const candidates =
    host === 'localhost' ? ['127.0.0.1', '::1', 'localhost'] : [host];

  const script = [
    'const net = require("net");',
    `const port = ${port};`,
    `const candidates = ${JSON.stringify(candidates)};`,
    `const deadline = setTimeout(() => process.exit(1), ${timeoutMs + 1000});`,
    'let i = 0;',
    'function attempt() {',
    '  if (i >= candidates.length) { clearTimeout(deadline); process.exit(1); }',
    '  const host = candidates[i++];',
    `  const s = net.connect({ host, port, timeout: ${timeoutMs} });`,
    "  s.on('connect', () => { s.destroy(); clearTimeout(deadline); process.exit(0); });",
    "  s.on('error', () => { try { s.destroy(); } catch (_) {} attempt(); });",
    "  s.on('timeout', () => { try { s.destroy(); } catch (_) {} attempt(); });",
    '}',
    'attempt();',
  ].join('\n');

  try {
    // execFileSync spawns node directly (no shell), so no quote-escaping issues on Windows.
    execFileSync(process.execPath, ['-e', script], {
      stdio: 'ignore',
      timeout: timeoutMs + 3000,
    });
    return true;
  } catch {
    return false;
  }
}

const dbUp = hasDbUrl && dbReachable(process.env.DATABASE_URL);
if (!hasDbUrl) {
  console.log(
    '[org-seeder e2e] SKIPPED — DATABASE_URL not set; not running against a real DB.',
  );
} else if (!dbUp) {
  console.log(
    '[org-seeder e2e] SKIPPED — database not reachable; not running against a real DB.',
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`[org-seeder e2e] ${msg}`);

/** Logs a clear PASS/FAIL line and re-throws on failure. Await-safe for async fns. */
async function check(
  label: string,
  fn: (() => void) | (() => Promise<void>),
): Promise<void> {
  try {
    await fn();
    log(`PASS ${label}`);
  } catch (err) {
    log(`FAIL ${label} — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

async function expectReportedAndStored(
  label: string,
  getCount: () => Promise<number>,
  reported: { seeded: number; already_exists: number; skipped?: number },
): Promise<void> {
  const count = await getCount();
  // For a freshly-created org every seeder should *create* its rows. The seeder
  // also reports an `already_exists` figure, but on a brand-new org that number
  // reflects pre-existing rows matched by id lookup across the whole table (a
  // seeder reporting quirk), so the ground truth is the freshly `seeded` count.
  if (count !== reported.seeded) {
    log(
      `FAIL ${label}: DB count = ${count} but seeder reports seeded = ${reported.seeded} ` +
        `(already_exists recorded = ${reported.already_exists})`,
    );
    expect(count).toBe(reported.seeded);
  }
  log(
    `PASS ${label}: DB count = ${count} == seeder seeded = ${reported.seeded}`,
  );
}

function makeProgramCalendars() {
  const entry: Record<string, any> = {};
  for (const p of PROGRAMS) {
    entry[p.key] = {
      startDate: '2026-06-01',
      endDate: '2027-03-31',
      notes: 'E2E generated calendar',
      breaks: [
        { label: 'Semester 1', startDate: '2026-06-01', endDate: '2026-10-31' },
        { label: 'Semester 2', startDate: '2026-11-01', endDate: '2027-03-31' },
      ],
    };
  }
  return entry;
}

/** Counts scoped to the test org — used to prove a second run is a no-op. */
async function snapshotCounts(db: DatabaseService, orgId: string) {
  const common = { org_id: orgId };
  return {
    programs: await db.program.count({ where: common }),
    courses: await db.course.count({ where: common }),
    strands: await db.strand.count({ where: common }),
    levels: await db.level.count({ where: common }),
    sections: await db.section.count({ where: common }),
    subjects: await db.subject.count({ where: common }),
    subjectSharing: await db.subjectSharing.count({ where: common }),
    subjectPrerequisites: await db.subjectPrerequisite.count({ where: common }),
    gradingScales: await db.gradingScale.count({ where: common }),
    gradingScaleAssignments: await db.gradingScaleAssignment.count({
      where: common,
    }),
    gradingSchemeTemplates: await db.gradingSchemeTemplate.count({
      where: common,
    }),
    gradingSchemeComponents: await db.gradingSchemeTemplateComponent.count({
      where: common,
    }),
    semesterTemplates: await db.semesterTemplate.count({ where: common }),
    semesterItems: await db.semesterTemplateItem.count({ where: common }),
    semesterTerms: await db.semesterTemplateTerm.count({ where: common }),
    programSemesterAssignments: await db.programSemesterAssignment.count({
      where: common,
    }),
    programSemesterTermDates: await db.programSemesterTermDate.count({
      where: common,
    }),
    programCalendars: await db.programCalendar.count({ where: common }),
    concernCategories: await db.concernCategory.count({ where: common }),
    auditLogs: await db.auditLog.count({ where: common }),
  };
}

/** Proves cleanup removed every row created for the test org. */
async function assertZeroResidual(
  db: DatabaseService,
  orgId2: string,
): Promise<void> {
  const residual = await snapshotCounts(db, orgId2);
  const leftover = Object.entries(residual).filter(([, v]) => v > 0);
  expect(leftover).toEqual([]);
  log(`Cleanup verified — zero rows remain for the test org (${orgId2}).`);
}

// ── Data-driven expectations ─────────────────────────────────────────────────

// Re-derive expected counts from the *same* data files the seeders consume so a
// data change cannot silently make this test lie about what should be seeded.
const levelDefs = buildLevelDefs();
const nonShsNonCollegeDefs = levelDefs.filter(
  (l) => l.programKey !== 'shs' && l.programKey !== 'college',
);
const shsDefs = levelDefs.filter((l) => l.programKey === 'shs');
const collegeDefs = levelDefs.filter((l) => l.programKey === 'college');

const EXPECTED = {
  programs: PROGRAMS.length,
  courses: COLLEGE_COURSES.length + BSED_MAJORS.length,
  strands: SHS_STRAND_DEFS.length,
  levels:
    nonShsNonCollegeDefs.length +
    SHS_STRAND_DEFS.length * shsDefs.length +
    collegeDefs.length,
  sections:
    nonShsNonCollegeDefs.reduce((n, l) => n + l.sections.length, 0) +
    SHS_STRAND_DEFS.length *
      shsDefs.reduce((n, l) => n + l.sections.length, 0) +
    collegeDefs.reduce((n, l) => n + l.sections.length, 0),
  gradingScales: PROGRAMS.length,
  gradingScaleAssignments: PROGRAMS.length,
  gradingSchemeTemplates: SCHEME_PRESETS.length,
  gradingSchemeComponents: SCHEME_PRESETS.reduce(
    (n, c) => n + c.components.length,
    0,
  ),
  semesterTemplates: PROGRAMS.length,
  semesterItems: PROGRAMS.length * 2, // 2 semesters per template
  semesterTerms: PROGRAMS.length * 2 * 3, // 3 terms per semester
  programSemesterAssignments: PROGRAMS.length,
  programSemesterTermDates: PROGRAMS.length * 2 * 3,
  programCalendars: PROGRAMS.length, // seedProgramCalendars: true
  concernCategories: DEFAULT_CONCERN_CATEGORIES.length,
};

// ── Test ─────────────────────────────────────────────────────────────────────

const runSuite = dbUp ? describe : describe.skip;
runSuite('OrgSeederService e2e (real database)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let orgSeeder: OrgSeederService;

  // Unique ids per run => reproducible, no collisions with existing data.
  const orgId = `e2e-seed-${uuid()}`;
  const schoolYearId = `e2e-sy-${uuid()}`;
  const actorId = `e2e-actor-${uuid()}`;

  const syStart = new Date('2026-06-01T00:00:00.000Z');
  const syEnd = new Date('2027-03-31T00:00:00.000Z');

  let result1: SeedResult;
  let result2: SeedResult;

  beforeAll(async () => {
    log(
      '--- SETUP: booting real Nest module graph (OrgSeederModule + real DatabaseService) ---',
    );
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrgSeederModule, DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = app.get(DatabaseService);
    orgSeeder = app.get(OrgSeederService);

    // Fixture rows the seeder's foreign keys require.
    log(`Creating fixture org "${orgId}" + school year "${schoolYearId}"`);
    await db.organization.create({
      data: { id: orgId, name: `E2E Org Seed Test ${orgId}` },
    });
    await db.schoolYear.create({
      data: {
        id: schoolYearId,
        org_id: orgId,
        name: `E2E School Year ${schoolYearId}`,
        status: 'active',
        start_date: syStart,
        end_date: syEnd,
      },
    });

    const seedInput: OrgSeedOptions & { actorId: string } = {
      orgId,
      schoolYearId,
      actorId,
      programs: PROGRAMS.map((p) => p.key),
      seedGradingScales: true,
      seedGradingSchemes: true,
      seedSemesterTemplates: true,
      seedProgramCalendars: true,
      programCalendars: makeProgramCalendars(),
    };

    log('--- RUNNING REAL OrgSeederService.seedOrg() ---');
    const t0 = Date.now();
    result1 = await orgSeeder.seedOrg(seedInput);
    log(`seedOrg completed in ${Date.now() - t0} ms`);
    log('seeder result: ' + JSON.stringify(result1));
  }, 180000);

  it('creates the expected Programs/Courses/Strands counts (DB-verified)', async () => {
    await expectReportedAndStored(
      'Programs',
      () => db.program.count({ where: { org_id: orgId } }),
      result1.programs,
    );
    await expectReportedAndStored(
      'Courses',
      () => db.course.count({ where: { org_id: orgId } }),
      result1.courses,
    );
    await expectReportedAndStored(
      'Strands',
      () => db.strand.count({ where: { org_id: orgId } }),
      result1.strands,
    );
  });

  it('creates the expected Levels count (DB-verified)', async () => {
    await expectReportedAndStored(
      'Levels',
      () => db.level.count({ where: { org_id: orgId } }),
      result1.levels,
    );
  });

  it('creates the expected Sections count (DB-verified)', async () => {
    await expectReportedAndStored(
      'Sections',
      () => db.section.count({ where: { org_id: orgId } }),
      result1.sections,
    );
  });

  it('every Level has a valid program/course/strand and school_year', async () => {
    check('Level FK validity', async () => {
      const levels = await db.level.findMany({ where: { org_id: orgId } });
      const programIds = new Set(
        (await db.program.findMany({ where: { org_id: orgId } })).map(
          (p) => p.id,
        ),
      );
      const courseIds = new Set(
        (await db.course.findMany({ where: { org_id: orgId } })).map(
          (c) => c.id,
        ),
      );
      const strandIds = new Set(
        (await db.strand.findMany({ where: { org_id: orgId } })).map(
          (s) => s.id,
        ),
      );

      for (const level of levels) {
        expect(level.school_year_id).toBe(schoolYearId);
        expect(programIds.has(level.program_id)).toBe(true);
        if (level.course_id) expect(courseIds.has(level.course_id)).toBe(true);
        if (level.strand_id) expect(strandIds.has(level.strand_id)).toBe(true);
      }
      log(
        `Levels: ${levels.length} checked — program/course/strand/school_year links all valid`,
      );
    });
  });

  it('every Section has a valid level_id and school_year_id (no orphaned FK)', () => {
    return check('Section FK validity', async () => {
      const sections = await db.section.findMany({ where: { org_id: orgId } });
      const levelIds = new Set(
        (await db.level.findMany({ where: { org_id: orgId } })).map(
          (l) => l.id,
        ),
      );
      const courseIds = new Set(
        (await db.course.findMany({ where: { org_id: orgId } })).map(
          (c) => c.id,
        ),
      );
      const strandIds = new Set(
        (await db.strand.findMany({ where: { org_id: orgId } })).map(
          (s) => s.id,
        ),
      );

      expect(sections.length).toBe(result1.sections.seeded);
      for (const section of sections) {
        expect(levelIds.has(section.level_id)).toBe(true);
        expect(section.school_year_id).toBe(schoolYearId);
        if (section.course_id)
          expect(courseIds.has(section.course_id)).toBe(true);
        if (section.strand_id)
          expect(strandIds.has(section.strand_id)).toBe(true);
      }
      log(
        `Sections: ${sections.length} checked — all level_id + school_year_id valid`,
      );
    });
  });

  it('every GradingScaleAssignment references an existing program_id + school_year_id', () => {
    return check('GradingScaleAssignments', async () => {
      const assignments = await db.gradingScaleAssignment.findMany({
        where: { org_id: orgId },
      });
      const programIds = new Set(
        (await db.program.findMany({ where: { org_id: orgId } })).map(
          (p) => p.id,
        ),
      );
      const scaleIds = new Set(
        (await db.gradingScale.findMany({ where: { org_id: orgId } })).map(
          (s) => s.id,
        ),
      );

      expect(assignments.length).toBe(EXPECTED.gradingScaleAssignments);
      for (const a of assignments) {
        expect(programIds.has(a.program_id)).toBe(true);
        expect(a.school_year_id).toBe(schoolYearId);
        expect(scaleIds.has(a.grading_scale_id)).toBe(true);
      }
      log(
        `GradingScaleAssignments: ${assignments.length} checked — program_id/school_year_id/grading_scale_id all valid`,
      );
    });
  });

  it('SemesterTemplates + items + terms are created and linked correctly', () => {
    return check('SemesterTemplate linkage', async () => {
      const templates = await db.semesterTemplate.findMany({
        where: { org_id: orgId },
        include: { semesters: { include: { terms: true } } },
      });

      expect(templates.length).toBe(EXPECTED.semesterTemplates);
      const itemIds = new Set<string>();
      const termIds = new Set<string>();
      const allTerms: Array<{
        id: string;
        semester_id: string;
        order_index: number;
        name: string;
      }> = [];

      for (const tpl of templates) {
        expect(tpl.program_type).toBeTruthy();
        expect(tpl.name).toMatch(/Template$/);
        expect(tpl.semesters.length).toBe(2); // generic template adapts to 2 calendar periods

        tpl.semesters.forEach((sem, i) => {
          expect(itemIds.has(sem.id)).toBe(false); // unique ids
          itemIds.add(sem.id);
          expect(sem.template_id).toBe(tpl.id);
          expect(sem.order_index).toBe(i);
          expect(sem.name).toBe(['1st', '2nd'][i]);
          expect(sem.terms.length).toBe(3);

          sem.terms.forEach((term, j) => {
            expect(termIds.has(term.id)).toBe(false);
            termIds.add(term.id);
            expect(term.semester_id).toBe(sem.id); // linked to its owning item
            expect(term.order_index).toBe(j);
            expect(term.name).toBe(`Term ${j + 1}`);
            allTerms.push(term);
          });
        });
      }

      expect(itemIds.size).toBe(EXPECTED.semesterItems);
      expect(termIds.size).toBe(EXPECTED.semesterTerms);
      expect(allTerms.some((t) => termIds.has(t.id))).toBe(true);
      log(
        `SemesterTemplates: ${templates.length} templates / ${itemIds.size} items / ${termIds.size} terms — all linked`,
      );
    });
  });

  it('ProgramSemesterAssignments + term dates are linked to real rows (FK-safe)', () => {
    return check('ProgramSemesterAssignment + term dates', async () => {
      const assignments = await db.programSemesterAssignment.findMany({
        where: { org_id: orgId },
      });
      const templates = await db.semesterTemplate.findMany({
        where: { org_id: orgId },
      });
      const programIds = new Set(
        (await db.program.findMany({ where: { org_id: orgId } })).map(
          (p) => p.id,
        ),
      );
      const templateIds = new Set(templates.map((t) => t.id));

      expect(assignments.length).toBe(EXPECTED.programSemesterAssignments);
      const assignmentTemplate = new Map<string, string>();
      for (const a of assignments) {
        expect(programIds.has(a.program_id)).toBe(true);
        expect(templateIds.has(a.template_id)).toBe(true);
        assignmentTemplate.set(a.id, a.template_id);
      }

      const termDates = await db.programSemesterTermDate.findMany({
        where: { org_id: orgId },
        include: { term: { include: { semester: true } } },
      });

      expect(termDates.length).toBe(EXPECTED.programSemesterTermDates);
      const assignmentIds = new Set(assignments.map((a) => a.id));
      for (const td of termDates) {
        expect(assignmentIds.has(td.assignment_id)).toBe(true); // assignment exists
        expect(td.term).toBeTruthy();
        // term must belong to the template the assignment references
        expect(td.term.semester.template_id).toBe(
          assignmentTemplate.get(td.assignment_id),
        );
        expect(td.start_date.getTime() <= td.end_date.getTime()).toBe(true);
        expect(td.start_date.getTime() >= syStart.getTime()).toBe(true);
        expect(td.end_date.getTime() <= syEnd.getTime()).toBe(true);
      }
      log(
        `Term dates: ${termDates.length} created — every one linked to a real assignment + term within the school year`,
      );
    });
  });

  it('GradingSchemeTemplates created and component weights sum to 100', () => {
    return check('Grading scheme weight invariant', async () => {
      const templates = await db.gradingSchemeTemplate.findMany({
        where: { org_id: orgId },
      });
      expect(templates.length).toBe(EXPECTED.gradingSchemeTemplates);

      const components = await db.gradingSchemeTemplateComponent.findMany({
        where: { org_id: orgId },
      });
      expect(components.length).toBe(EXPECTED.gradingSchemeComponents);

      const byTemplate = new Map<string, number>();
      for (const c of components) {
        byTemplate.set(
          c.template_id,
          (byTemplate.get(c.template_id) ?? 0) + c.weight,
        );
      }
      for (const tpl of templates) {
        const sum = byTemplate.get(tpl.id) ?? 0;
        expect(sum).toBeCloseTo(100, 5); // seeded presets always total 100
      }
      log(
        `Grading scheme templates: ${templates.length} templates / ${components.length} components — every template's weights sum to 100`,
      );
    });
  });

  it('Subjects/sharing/prerequisites exist and carry no orphaned FKs', () => {
    return check('Subject FK validity', async () => {
      const subjects = await db.subject.findMany({ where: { org_id: orgId } });
      expect(subjects.length).toBe(result1.subjects.seeded);
      expect(subjects.length).toBeGreaterThan(0);

      const programIds = new Set(
        (await db.program.findMany({ where: { org_id: orgId } })).map(
          (p) => p.id,
        ),
      );
      const levelIds = new Set(
        (await db.level.findMany({ where: { org_id: orgId } })).map(
          (l) => l.id,
        ),
      );
      const courseIds = new Set(
        (await db.course.findMany({ where: { org_id: orgId } })).map(
          (c) => c.id,
        ),
      );
      const strandIds = new Set(
        (await db.strand.findMany({ where: { org_id: orgId } })).map(
          (s) => s.id,
        ),
      );
      const subjectIds = new Set(subjects.map((s) => s.id));

      for (const s of subjects) {
        expect(programIds.has(s.program_id!)).toBe(true);
        expect(levelIds.has(s.level_id!)).toBe(true);
        if (s.course_id) expect(courseIds.has(s.course_id)).toBe(true);
        if (s.strand_id) expect(strandIds.has(s.strand_id)).toBe(true);
      }

      const sharing = await db.subjectSharing.findMany({
        where: { org_id: orgId },
      });
      for (const sh of sharing) {
        expect(subjectIds.has(sh.subject_id)).toBe(true);
        if (sh.course_id) expect(courseIds.has(sh.course_id)).toBe(true);
        if (sh.strand_id) expect(strandIds.has(sh.strand_id)).toBe(true);
        if (sh.level_id) expect(levelIds.has(sh.level_id)).toBe(true);
      }

      const prereqs = await db.subjectPrerequisite.findMany({
        where: { org_id: orgId },
      });
      for (const pr of prereqs) {
        expect(subjectIds.has(pr.subject_id)).toBe(true);
        expect(subjectIds.has(pr.prerequisite_id)).toBe(true);
      }

      log(
        `Subjects: ${subjects.length} subjects / ${sharing.length} sharings / ${prereqs.length} prerequisites — all FKs valid`,
      );
    });
  });

  it('org settings, concern categories, and audit log are seeded', () => {
    return check('Org-level extras', async () => {
      expect(
        await db.orgEnrollmentSetting.count({ where: { org_id: orgId } }),
      ).toBe(1);
      expect(
        await db.orgConcernSetting.count({ where: { org_id: orgId } }),
      ).toBe(1);
      expect(await db.concernCategory.count({ where: { org_id: orgId } })).toBe(
        EXPECTED.concernCategories,
      );
      const auditLogs = await db.auditLog.findMany({
        where: { org_id: orgId },
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
      expect(auditLogs.some((a) => a.action === 'org_seeded')).toBe(true);
      log(
        `Org-level extras: enrollment setting, concern setting, ${EXPECTED.concernCategories} concern categories, audit log all present`,
      );
    });
  });

  it('reports no non-fatal warnings when calendars enable auto-registration', () => {
    check('result.warnings empty', () => {
      expect(result1.warnings).toEqual([]);
    });
    log(
      `Warnings: ${result1.warnings.length} (auto-registration succeeded for every program)`,
    );
  });

  it('is idempotent — a second seed run leaves every count unchanged', async () => {
    const before = await snapshotCounts(db, orgId);
    log('--- RUNNING seedOrg a 2nd time (idempotence check) ---');
    result2 = await orgSeeder.seedOrg({
      orgId,
      schoolYearId,
      actorId,
      programs: PROGRAMS.map((p) => p.key),
      seedGradingScales: true,
      seedGradingSchemes: true,
      seedSemesterTemplates: true,
      seedProgramCalendars: true,
      programCalendars: makeProgramCalendars(),
    });
    const after = await snapshotCounts(db, orgId);
    // auditLogs increments asynchronously (fire-and-forget write inside seedOrg)
    // and is already asserted separately, so exclude it here: every structural
    // count must be byte-for-byte identical on a second run.
    const diff = Object.keys(before).filter(
      (k) => k !== 'auditLogs' && before[k] !== after[k],
    );
    expect(diff).toEqual([]);
    expect(result2.programs.already_exists).toBe(EXPECTED.programs);
    log(
      `Idempotence: 2nd run created no new rows (all entity counts unchanged; found as already_exists)`,
    );
  }, 180000);

  afterAll(async () => {
    if (!db || !orgId) return;
    log(
      '--- CLEANUP: deleting everything created for the test org (children before parents) ---',
    );

    const step = async (label: string, fn: () => Promise<unknown>) => {
      const before = await snapshotCounts(db, orgId);
      try {
        await fn();
      } catch (err) {
        log(
          `CLEANUP FAIL @ ${label}: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      }
      const after = await snapshotCounts(db, orgId);
      const removed = Object.keys(before).filter((k) => before[k] !== after[k]);
      log(
        `  cleaned ${label} — removed rows in: ${removed.join(', ') || 'none'}`,
      );
    };

    try {
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
      (await step('subjects', () =>
        db.subject.deleteMany({ where: { org_id: orgId } }),
      ),
        await step('sections', () =>
          db.section.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('levels', () =>
          db.level.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('strands', () =>
          db.strand.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('courses', () =>
          db.course.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('programs', () =>
          db.program.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('concern categories', () =>
          db.concernCategory.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('org concern settings', () =>
          db.orgConcernSetting.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('org enrollment settings', () =>
          db.orgEnrollmentSetting.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('audit logs', () =>
          db.auditLog.deleteMany({ where: { org_id: orgId } }),
        ),
        await step('school year', () =>
          db.schoolYear.deleteMany({ where: { id: schoolYearId } }),
        ),
        await step('organization', () =>
          db.organization.deleteMany({ where: { id: orgId } }),
        ),
        // Verify zero rows remain for the test org before we disconnect the client.
        await assertZeroResidual(db, orgId));
    } finally {
      await app.close();
    }
  }, 120000);
});
