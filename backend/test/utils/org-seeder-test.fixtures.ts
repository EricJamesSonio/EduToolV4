// backend/test/utils/org-seeder-test.fixtures.ts
//
// Non-assertion helpers for org-seeder.e2e-spec.ts: logging, pass/fail
// bookkeeping, DB snapshotting, and the "expected counts" re-derived from
// the same seed data files the seeders themselves consume (so a data change
// can't silently make the test lie about what should be seeded).
//
// Deliberately does NOT use jest's `expect` — kept out of this module so it
// stays a plain, portable .ts file regardless of where jest globals are
// typed in this project's tsconfig.

import type { DatabaseService } from '@/core/database/database.provider';
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
import { typedKeys } from './typed-object.util';

const LOG_PREFIX = '[org-seeder e2e]';

export const log = (msg: string): void => console.log(`${LOG_PREFIX} ${msg}`);

/** Logs a clear PASS/FAIL line and re-throws on failure. Await-safe for async fns. */
export async function check(
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

// Every entity bucket in SeedResult (programs, courses, subjects, ...) is
// used interchangeably in the spec with this shape — reused here instead of
// a fabricated inline type, so it stays in sync with the real seeder.
export type SeedCountResult = SeedResult['programs'];

// Reused directly from OrgSeedOptions instead of a fabricated shape, so this
// stays correct if the seeder's calendar input type ever changes.
type ProgramCalendarSeedMap = NonNullable<OrgSeedOptions['programCalendars']>;
type ProgramCalendarSeedInput = ProgramCalendarSeedMap[string];

export function makeProgramCalendars(): ProgramCalendarSeedMap {
  const entry: ProgramCalendarSeedMap = {};
  for (const p of PROGRAMS) {
    const calendar: ProgramCalendarSeedInput = {
      startDate: '2026-06-01',
      endDate: '2027-03-31',
      notes: 'E2E generated calendar',
      breaks: [
        {
          label: 'Semester 1',
          startDate: '2026-06-01',
          endDate: '2026-10-31',
        },
        {
          label: 'Semester 2',
          startDate: '2026-11-01',
          endDate: '2027-03-31',
        },
      ],
    };
    entry[p.key] = calendar;
  }
  return entry;
}

export interface OrgSeedCountsSnapshot {
  programs: number;
  courses: number;
  strands: number;
  levels: number;
  sections: number;
  subjects: number;
  subjectSharing: number;
  subjectPrerequisites: number;
  gradingScales: number;
  gradingScaleAssignments: number;
  gradingSchemeTemplates: number;
  gradingSchemeComponents: number;
  semesterTemplates: number;
  semesterItems: number;
  semesterTerms: number;
  programSemesterAssignments: number;
  programSemesterTermDates: number;
  programCalendars: number;
  concernCategories: number;
  auditLogs: number;
}

/** Counts scoped to the test org — used to prove a second run is a no-op. */
export async function snapshotCounts(
  db: DatabaseService,
  orgId: string,
): Promise<OrgSeedCountsSnapshot> {
  const common = { org_id: orgId };
  return {
    programs: await db.program.count({ where: common }),
    courses: await db.course.count({ where: common }),
    strands: await db.strand.count({ where: common }),
    levels: await db.level.count({ where: common }),
    sections: await db.section.count({ where: common }),
    subjects: await db.subject.count({ where: common }),
    subjectSharing: await db.subjectSharing.count({ where: common }),
    subjectPrerequisites: await db.subjectPrerequisite.count({
      where: common,
    }),
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

/** Keys where `before` and `after` differ, excluding any in `ignoreKeys`. */
export function diffCounts(
  before: OrgSeedCountsSnapshot,
  after: OrgSeedCountsSnapshot,
  ignoreKeys: (keyof OrgSeedCountsSnapshot)[] = [],
): (keyof OrgSeedCountsSnapshot)[] {
  return typedKeys(before).filter(
    (k) => !ignoreKeys.includes(k) && before[k] !== after[k],
  );
}

// ── Data-driven expectations ────────────────────────────────────────────────
// Re-derive expected counts from the *same* data files the seeders consume so
// a data change cannot silently make this test lie about what should be seeded.
export function computeExpectedCounts() {
  const levelDefs = buildLevelDefs();
  const nonShsNonCollegeDefs = levelDefs.filter(
    (l) => l.programKey !== 'shs' && l.programKey !== 'college',
  );
  const shsDefs = levelDefs.filter((l) => l.programKey === 'shs');
  const collegeDefs = levelDefs.filter((l) => l.programKey === 'college');

  return {
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
}

export type ExpectedCounts = ReturnType<typeof computeExpectedCounts>;
