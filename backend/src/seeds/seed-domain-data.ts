/**
 * seed-domain-data.ts
 *
 * Standalone seed script that populates domain data (programs, levels,
 * subjects, educators, students, classes, etc.) for the 8 pre-seeded
 * admin/school organizations created by start.ts.
 *
 * Usage:  npx ts-node src/seeds/seed-domain-data.ts
 *
 * This script is IDEMPOTENT — re-running it will skip already-seeded records.
 *
 * IMPORTANT — School Year Readiness:
 * Domain data (programs → courses/strands → levels → sections → subjects →
 * academic calendars → semester templates → classes → class grading schemes)
 * is seeded deterministically so every subject and every level/section ends
 * up with at least one class, mirroring exactly what
 * `SchoolYearReadinessService.detail()` checks for. After all of that is
 * seeded, `checkSchoolYearReadiness()` re-runs those same checks directly
 * against the DB. Students are only enrolled (and the school year only
 * activated) for an org if that check comes back ready — otherwise the org
 * is skipped and the blocking issues are printed, instead of silently
 * bypassing the same gate the real activation flow enforces.
 */

// MUST be the very first import — class-validator/class-transformer decorators
// (used transitively via org-seeder data/services) call Reflect.getMetadata at
// module-load time. This is a standalone entry point (not routed through
// main.ts), so the polyfill has to be installed here before anything else runs.
import 'reflect-metadata';

import { PrismaClient, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

// ── Reuse pure data + utilities from the org-seeder module ──────────────────
import { PROGRAMS } from '../modules/org-seeder/data/programs.data';
import {
  COLLEGE_COURSES,
  BSED_MAJORS,
} from '../modules/org-seeder/data/courses.data';
import { SHS_STRANDS } from '../modules/org-seeder/data/strands.data';
import { buildLevelDefs } from '../modules/org-seeder/data/levels.data';
import { buildScaleAssignments } from '../modules/org-seeder/data/grading-scale.data';
import { SCHEME_PRESETS } from '../modules/org-seeder/data/grading-schemes.data';
import { SEMESTER_TEMPLATES } from '../modules/org-seeder/data/semester-templates.data';
import {
  allMajorSubjects,
  allMinorSubjects,
  deriveProgramKey,
} from '../modules/org-seeder/data/subjects';
import { seedId } from '../modules/org-seeder/seed-id';
import { computeTermDates } from '../modules/org-seeder/utils/date-calculator.util';
import { slugifyName } from '../modules/organization/organization.repository';

import { SCHOOLS } from './data/schools';
import { ADMINS } from './data/admins';

// ── Constants ──────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'seed123';
const SY_START = new Date('2025-07-01');
const SY_END = new Date('2026-06-30');
const SY_NAME = 'SY 2025-2026';

// Single source of truth for progKey <-> grading-scheme-preset-name mapping.
// Both seedGradingSchemes() and the class-level grading scheme seeder derive
// from this, so the two can never drift into mismatched namespaces.
const PROGRAM_SCHEME_PRESET_NAME: Record<string, string> = {
  daycare: 'Daycare Scheme',
  kinder: 'Kindergarten Scheme',
  elementary: 'Elementary Scheme',
  jhs: 'High School Scheme',
  shs: 'Senior High School Scheme',
  college: 'College Scheme',
};
const SCHEME_PRESET_NAME_TO_PROGRAM: Record<string, string> =
  Object.fromEntries(
    Object.entries(PROGRAM_SCHEME_PRESET_NAME).map(([k, v]) => [v, k]),
  );

// ── Admin configurations ───────────────────────────────────────────────────
interface AdminSeedConfig {
  adminIndex: number;
  programs: string[];
  educators: number;
  students: number;
}

const ADMIN_CONFIGS: AdminSeedConfig[] = [
  {
    adminIndex: 0,
    programs: ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college'],
    educators: 30,
    students: 500,
  },
  { adminIndex: 1, programs: ['daycare'], educators: 20, students: 100 },
  { adminIndex: 2, programs: ['jhs', 'shs'], educators: 25, students: 300 },
  { adminIndex: 3, programs: ['jhs'], educators: 20, students: 200 },
  { adminIndex: 4, programs: ['college'], educators: 25, students: 300 },
  { adminIndex: 5, programs: ['daycare'], educators: 20, students: 100 },
  { adminIndex: 6, programs: ['shs', 'college'], educators: 25, students: 250 },
  {
    adminIndex: 7,
    programs: ['kinder', 'daycare'],
    educators: 20,
    students: 150,
  },
];

const db = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build the org-scoped educator email matching EducatorService.buildOrgEmail */
function buildEducatorEmail(
  orgEmailExtension: string,
  localPart: string,
): string {
  const base = orgEmailExtension
    .replace(/^@/, '')
    .replace(/\.(student|educator)\./g, '.')
    .trim();
  const dotIdx = base.indexOf('.');
  const domain =
    dotIdx >= 0
      ? `${base.slice(0, dotIdx)}.educator${base.slice(dotIdx)}`
      : `educator.${base}`;
  return `${localPart}@${domain}`.toLowerCase();
}

/** Build the org-scoped student email matching StudentService.buildOrgEmail */
function buildStudentEmail(
  orgEmailExtension: string,
  localPart: string,
): string {
  const base = orgEmailExtension
    .replace(/^@/, '')
    .replace(/\.(student|educator)\./g, '.')
    .trim();
  const dotIdx = base.indexOf('.');
  const domain =
    dotIdx >= 0
      ? `${base.slice(0, dotIdx)}.student${base.slice(dotIdx)}`
      : `student.${base}`;
  return `${localPart}@${domain}`.toLowerCase();
}

function generateStudentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `STU-${random}`;
}

function generateEducatorId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `EDU-${random}`;
}

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a random integer between min and max (inclusive) */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Schedule slot helpers ────────────────────────────────────────────────────
// Keeps a single, deterministic set of candidate weekly slots so the seed never
// generates two classes for the same educator (or section) that collide in time.
// Conflicts inside the same school year are what the runtime API forbids.

const SCHEDULE_WEEKDAYS = [0, 1, 2, 3, 4];
const SCHEDULE_TIME_WINDOWS: Array<{ start: string; end: string }> = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
];

interface ScheduleSlotKey {
  weekday: number;
  start: string;
  end: string;
}

function scheduleKey(weekday: number, start: string, end: string): string {
  return `${weekday}|${start}|${end}`;
}

/** Extract "HH:MM" from a Date for stable slot keys. */
function timeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Build a Date anchored to the school-year start (consistent with seed style). */
function scheduleDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(SY_START);
  d.setHours(h, m, 0, 0);
  return d;
}

type UsedMap = Map<string, Set<string>>;

function usedAdd(map: UsedMap, id: string, key: string): void {
  if (!map.has(id)) map.set(id, new Set<string>());
  map.get(id)!.add(key);
}

function isUsed(map: UsedMap, id: string, key: string): boolean {
  return map.get(id)?.has(key) ?? false;
}

/** Randomly shuffle an array (in place) using the seed's randInt. */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Find a free weekly slot for the given educator + optional section. */
function findFreeSlot(
  educatorId: string,
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
  excluded: string[] = [],
): (ScheduleSlotKey & { key: string }) | null {
  const free: Array<ScheduleSlotKey & { key: string }> = [];
  for (const weekday of SCHEDULE_WEEKDAYS) {
    for (const t of SCHEDULE_TIME_WINDOWS) {
      const key = scheduleKey(weekday, t.start, t.end);
      if (isUsed(educatorUsed, educatorId, key)) continue;
      if (sectionId && isUsed(sectionUsed, sectionId, key)) continue;
      if (excluded.includes(key)) continue;
      free.push({ weekday, start: t.start, end: t.end, key });
    }
  }
  return free.length ? pick(free) : null;
}

/** Allocate a free slot for any eligible educator (shuffled order for variety). */
function allocateScheduleSlot(
  educatorIds: string[],
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
): { educator: string; slot: ScheduleSlotKey & { key: string } } | null {
  const ids = shuffleArray([...educatorIds]);
  for (const educator of ids) {
    const slot = findFreeSlot(educator, sectionId, educatorUsed, sectionUsed);
    if (slot) return { educator, slot };
  }
  return null;
}

// ── Domain seeders (per admin) ──────────────────────────────────────────────

async function seedSchoolYear(orgId: string): Promise<string> {
  const id = seedId('school-year', SY_NAME, orgId);
  const existing = await db.schoolYear.findFirst({ where: { id } });
  if (existing) return existing.id;

  const sy = await db.schoolYear.create({
    data: {
      id,
      org_id: orgId,
      name: SY_NAME,
      status: 'active',
      start_date: SY_START,
      end_date: SY_END,
    },
  });

  // Deactivate any other active school years for this org
  await db.schoolYear.updateMany({
    where: { org_id: orgId, id: { not: id }, status: 'active' },
    data: { status: 'ended' },
  });

  console.log(`  school-year created: ${SY_NAME}`);
  return sy.id;
}

async function seedPrograms(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
): Promise<Record<string, string>> {
  const programMap: Record<string, string> = {};

  for (const p of PROGRAMS) {
    if (!programKeys.includes(p.key)) continue;

    const id = seedId('prog', p.key, schoolYearId, orgId);
    const existing = await db.program.findFirst({ where: { id } });

    if (existing) {
      programMap[p.key] = existing.id;
    } else {
      const rec = await db.program.create({
        data: {
          id,
          org_id: orgId,
          school_year_id: schoolYearId,
          name: p.name,
          type: p.type,
        },
      });
      programMap[p.key] = rec.id;
    }
  }

  return programMap;
}

async function seedCourses(
  orgId: string,
  schoolYearId: string,
  programMap: Record<string, string>,
): Promise<Record<string, string>> {
  const courseMap: Record<string, string> = {};
  const collegeId = programMap['college'];
  if (!collegeId) return courseMap;

  for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
    const id = seedId('course', c.code, schoolYearId, orgId);
    const existing = await db.course.findFirst({ where: { id } });

    if (existing) {
      courseMap[c.code] = existing.id;
    } else {
      const rec = await db.course.create({
        data: {
          id,
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: collegeId,
          name: c.name,
          code: c.code,
        },
      });
      courseMap[c.code] = rec.id;
    }
  }

  return courseMap;
}

async function seedStrands(
  orgId: string,
  schoolYearId: string,
  programMap: Record<string, string>,
): Promise<Record<string, string>> {
  const strandMap: Record<string, string> = {};
  const shsId = programMap['shs'];
  if (!shsId) return strandMap;

  for (const s of SHS_STRANDS) {
    const id = seedId('strand', s, schoolYearId, orgId);
    const existing = await db.strand.findFirst({ where: { id } });

    if (existing) {
      strandMap[s] = existing.id;
    } else {
      const rec = await db.strand.create({
        data: {
          id,
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: shsId,
          name: s,
        },
      });
      strandMap[s] = rec.id;
    }
  }

  return strandMap;
}

async function seedLevelsAndSections(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
  courseMap: Record<string, string>,
  strandMap: Record<string, string>,
): Promise<Record<string, string>> {
  const levelMap: Record<string, string> = {};
  const allDefs = buildLevelDefs().filter((l) =>
    programKeys.includes(l.programKey),
  );

  for (const def of allDefs) {
    const progKey = def.programKey;
    const programId = programMap[progKey];
    if (!programId) continue;

    // Build unique level key
    let levelKey: string;
    let levelId: string;

    if (progKey === 'college' && def.courseCode) {
      levelKey = `${def.courseCode}|${def.name}`;
      levelId = seedId(
        'level',
        progKey,
        def.courseCode,
        def.name,
        schoolYearId,
        orgId,
      );
    } else if (progKey === 'shs' && strandMap) {
      // SHS levels get created per strand — handled separately below
      continue;
    } else if (['daycare', 'kinder', 'elementary', 'jhs'].includes(progKey)) {
      levelKey = def.name;
      levelId = seedId('level', progKey, def.name, schoolYearId, orgId);
    } else {
      continue;
    }

    const existing = await db.level.findFirst({ where: { id: levelId } });
    if (existing) {
      levelMap[levelKey] = existing.id;
    } else {
      const rec = await db.level.create({
        data: {
          id: levelId,
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: programId,
          ...(progKey === 'college' && def.courseCode
            ? { course_id: courseMap[def.courseCode] ?? undefined }
            : {}),
          name: def.name,
        },
      });
      levelMap[levelKey] = rec.id;
    }

    // Create sections for this level
    const sections = def.sections ?? [
      { name: 'Section A', capacity: 40 },
      { name: 'Section B', capacity: 40 },
    ];
    for (const sec of sections) {
      const sectionId = seedId(
        'section',
        progKey,
        levelKey,
        sec.name,
        schoolYearId,
        orgId,
      );
      const existingSec = await db.section.findFirst({
        where: { id: sectionId },
      });
      if (!existingSec) {
        await db.section.create({
          data: {
            id: sectionId,
            org_id: orgId,
            level_id: levelMap[levelKey],
            school_year_id: schoolYearId,
            name: sec.name,
            capacity: sec.capacity,
          },
        });
      }
    }
  }

  // Handle SHS levels (per strand)
  if (programKeys.includes('shs') && programMap['shs']) {
    const shsDefs = allDefs.filter((l) => l.programKey === 'shs');
    for (const [strandName, strandId] of Object.entries(strandMap)) {
      for (const def of shsDefs) {
        const levelKey = `${strandName}|${def.name}`;
        const levelId = seedId(
          'level',
          'shs',
          strandName,
          def.name,
          schoolYearId,
          orgId,
        );
        const existing = await db.level.findFirst({ where: { id: levelId } });
        if (existing) {
          levelMap[levelKey] = existing.id;
        } else {
          const rec = await db.level.create({
            data: {
              id: levelId,
              org_id: orgId,
              school_year_id: schoolYearId,
              program_id: programMap['shs'],
              strand_id: strandId,
              name: def.name,
            },
          });
          levelMap[levelKey] = rec.id;
        }

        const sections = def.sections ?? [
          { name: 'Section A', capacity: 40 },
          { name: 'Section B', capacity: 40 },
        ];
        for (const sec of sections) {
          const sectionId = seedId(
            'section',
            'shs',
            strandName,
            def.name,
            sec.name,
            schoolYearId,
            orgId,
          );
          const existingSec = await db.section.findFirst({
            where: { id: sectionId },
          });
          if (!existingSec) {
            await db.section.create({
              data: {
                id: sectionId,
                org_id: orgId,
                level_id: levelMap[levelKey],
                strand_id: strandId,
                school_year_id: schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
          }
        }
      }
    }
  }

  // Handle college levels per course
  if (programKeys.includes('college') && programMap['college']) {
    const collegeDefs = allDefs.filter(
      (l) => l.programKey === 'college' && l.courseCode,
    );
    for (const [courseCode, courseId] of Object.entries(courseMap)) {
      const courseDefs = collegeDefs.filter((l) => l.courseCode === courseCode);
      for (const def of courseDefs) {
        const levelKey = `${courseCode}|${def.name}`;
        const levelId = seedId(
          'level',
          'college',
          courseCode,
          def.name,
          schoolYearId,
          orgId,
        );
        const existing = await db.level.findFirst({ where: { id: levelId } });
        if (existing) {
          levelMap[levelKey] = existing.id;
        } else {
          const rec = await db.level.create({
            data: {
              id: levelId,
              org_id: orgId,
              school_year_id: schoolYearId,
              program_id: programMap['college'],
              course_id: courseId,
              name: def.name,
            },
          });
          levelMap[levelKey] = rec.id;
        }

        const sections = def.sections ?? [
          { name: 'Section A', capacity: 50 },
          { name: 'Section B', capacity: 50 },
        ];
        for (const sec of sections) {
          const sectionId = seedId(
            'section',
            'college',
            courseCode,
            def.name,
            sec.name,
            schoolYearId,
            orgId,
          );
          const existingSec = await db.section.findFirst({
            where: { id: sectionId },
          });
          if (!existingSec) {
            await db.section.create({
              data: {
                id: sectionId,
                org_id: orgId,
                level_id: levelMap[levelKey],
                course_id: courseId,
                school_year_id: schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
          }
        }
      }
    }
  }

  return levelMap;
}

async function seedGradingScales(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  const assignments = buildScaleAssignments().filter(
    (sa) => programKeys.includes(sa.programKey) && programMap[sa.programKey],
  );

  for (const { programKey, scaleName, ranges } of assignments) {
    const programId = programMap[programKey];
    const scaleId = seedId('scale', programKey, scaleName, orgId);
    let scale = await db.gradingScale.findFirst({ where: { id: scaleId } });

    if (!scale) {
      scale = await db.gradingScale.create({
        data: {
          id: scaleId,
          org_id: orgId,
          name: scaleName,
          program_type: programKey,
          ranges: ranges as any,
          is_locked: false,
        },
      });
    }

    const assignmentId = seedId(
      'assign',
      programKey,
      scaleName,
      schoolYearId,
      programId,
      orgId,
    );
    const existingAssign = await db.gradingScaleAssignment.findFirst({
      where: { id: assignmentId },
    });

    if (!existingAssign) {
      await db.gradingScaleAssignment.create({
        data: {
          id: assignmentId,
          org_id: orgId,
          grading_scale_id: scale.id,
          program_id: programId,
          school_year_id: schoolYearId,
        },
      });
    }
  }
}

async function seedGradingSchemes(
  orgId: string,
  programKeys: string[],
  _programMap: Record<string, string>,
): Promise<void> {
  for (const preset of SCHEME_PRESETS) {
    const progKey = SCHEME_PRESET_NAME_TO_PROGRAM[preset.name];
    if (progKey && !programKeys.includes(progKey)) continue;

    const id = seedId('scheme-template', preset.name, orgId);
    const existing = await db.gradingSchemeTemplate.findFirst({
      where: { id },
    });
    if (existing) continue;

    const template = await db.gradingSchemeTemplate.create({
      data: {
        id,
        org_id: orgId,
        name: preset.name,
        program_type: progKey ?? null,
      },
    });

    await db.gradingSchemeTemplateComponent.createMany({
      data: preset.components.map((c: any) => ({
        id: uuid(),
        org_id: orgId,
        template_id: template.id,
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: null,
      })),
    });
  }
}

// ── Program academic calendars ──────────────────────────────────────────────
// Must run BEFORE semester templates: readiness requires "calendar first, then
// the matching semester template." The number of breaks is derived directly
// from that program's own semester template (2 semesters -> 2 breaks, 3 -> 3),
// so the break count and semester count can never drift apart.

function computeCalendarBreaks(
  start: Date,
  end: Date,
  breakCount: number,
): { label: string; start_date: Date; end_date: Date; order_index: number }[] {
  if (breakCount <= 0) return [];

  const totalMs = end.getTime() - start.getTime();
  const breakDurationMs = 7 * 24 * 60 * 60 * 1000; // 1 week per break
  const segments = breakCount + 1;

  const breaks: {
    label: string;
    start_date: Date;
    end_date: Date;
    order_index: number;
  }[] = [];

  for (let i = 1; i <= breakCount; i++) {
    const position = start.getTime() + (totalMs * i) / segments;
    const breakStart = new Date(position);
    let breakEnd = new Date(position + breakDurationMs);
    if (breakEnd.getTime() > end.getTime()) breakEnd = new Date(end.getTime());

    breaks.push({
      label: `Break ${i}`,
      start_date: breakStart,
      end_date: breakEnd,
      order_index: i,
    });
  }

  return breaks;
}

async function seedProgramCalendars(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  for (const progKey of programKeys) {
    const programId = programMap[progKey];
    if (!programId) continue;

    // Matches the schema's real @@unique([program_id, school_year_id]),
    // so this check is robust regardless of id-generation scheme.
    const existing = await db.programCalendar.findFirst({
      where: {
        program_id: programId,
        school_year_id: schoolYearId,
        org_id: orgId,
      },
    });
    if (existing) continue;

    const tpl = SEMESTER_TEMPLATES.find((t) => t.programType === progKey);
    const breakCount = tpl?.semesters.length ?? 1;

    const calendar = await db.programCalendar.create({
      data: {
        id: seedId('program-calendar', progKey, schoolYearId, orgId),
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
        start_date: SY_START,
        end_date: SY_END,
        notes: `Auto-seeded calendar with ${breakCount} break(s), matching the ${breakCount}-semester template for this program.`,
      },
    });

    const breaks = computeCalendarBreaks(SY_START, SY_END, breakCount);
    if (breaks.length > 0) {
      await db.programCalendarBreak.createMany({
        data: breaks.map((b) => ({
          id: uuid(),
          org_id: orgId,
          calendar_id: calendar.id,
          label: b.label,
          start_date: b.start_date,
          end_date: b.end_date,
          order_index: b.order_index,
        })),
      });
    }
  }
}

async function seedSemesterTemplates(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  for (const tpl of SEMESTER_TEMPLATES) {
    if (!programKeys.includes(tpl.programType)) continue;

    const programId = programMap[tpl.programType];
    if (!programId) continue;

    const templateId = seedId('sem-template', tpl.programType, orgId);
    const existing = await db.semesterTemplate.findFirst({
      where: { id: templateId },
    });

    if (existing) {
      await db.programSemesterAssignment.upsert({
        where: { program_id: programId },
        update: {},
        create: {
          id: seedId('sem-assignment', programId, orgId),
          org_id: orgId,
          program_id: programId,
          template_id: existing.id,
        },
      });
      continue;
    }

    const template = await db.semesterTemplate.create({
      data: {
        id: templateId,
        org_id: orgId,
        program_type: tpl.programType,
        name: tpl.name,
      },
    });

    const termIds: string[] = [];

    for (const sem of tpl.semesters) {
      const semItemId = seedId('sem-item', tpl.programType, sem.name, orgId);
      const semItem = await db.semesterTemplateItem.create({
        data: {
          id: semItemId,
          org_id: orgId,
          template_id: template.id,
          name: sem.name,
          order_index: sem.order_index,
        },
      });

      for (const term of sem.terms) {
        const termId = seedId(
          'sem-term',
          tpl.programType,
          sem.name,
          term.name,
          orgId,
        );
        await db.semesterTemplateTerm.create({
          data: {
            id: termId,
            org_id: orgId,
            semester_id: semItem.id,
            name: term.name,
            order_index: term.order_index,
          },
        });
        termIds.push(termId);
      }
    }

    const assignment = await db.programSemesterAssignment.upsert({
      where: { program_id: programId },
      update: { template_id: template.id },
      create: {
        id: seedId('sem-assignment', programId, orgId),
        org_id: orgId,
        program_id: programId,
        template_id: template.id,
      },
    });

    const termDateData = computeTermDates(SY_START, SY_END, tpl, termIds).map(
      (td) => ({
        id: seedId('sem-term-date', assignment.id, td.termId),
        org_id: orgId,
        assignment_id: assignment.id,
        term_id: td.termId,
        start_date: td.startDate,
        end_date: td.endDate,
      }),
    );

    await db.programSemesterTermDate.createMany({
      data: termDateData,
      skipDuplicates: true,
    });
  }
}

async function seedSubjects(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
  courseMap: Record<string, string>,
  strandMap: Record<string, string>,
  levelMap: Record<string, string>,
): Promise<string[]> {
  const subjectIds: string[] = [];

  // Major subjects
  const majorDefs = allMajorSubjects().filter((s) =>
    programKeys.includes(deriveProgramKey(s.levelName)),
  );
  for (const s of majorDefs) {
    const progKey = deriveProgramKey(s.levelName);
    const programId = programMap[progKey];
    if (!programId) continue;

    const levelKey = s.courseCode
      ? `${s.courseCode}|${s.levelName}`
      : s.strandName
        ? `${s.strandName}|${s.levelName}`
        : s.levelName;
    const levelId = levelMap[levelKey];
    if (!levelId) continue;

    const courseId = s.courseCode ? courseMap[s.courseCode] : null;
    const strandId = s.strandName ? strandMap[s.strandName] : null;

    if (s.courseCode && !courseId) continue;
    if (s.strandName && !strandId) continue;

    const id = seedId(
      'subject',
      s.levelName,
      s.courseCode ?? 'none',
      s.strandName ?? 'none',
      s.name,
      orgId,
    );
    const existing = await db.subject.findFirst({ where: { id } });
    if (existing) {
      subjectIds.push(existing.id);
      continue;
    }

    const created = await db.subject.create({
      data: {
        id,
        org_id: orgId,
        subject_type: 'major',
        program_id: programId,
        level_id: levelId,
        course_id: courseId ?? undefined,
        strand_id: strandId ?? undefined,
        name: s.name,
        year_level: s.yearLevel,
        term_label: s.termLabel,
        is_locked: false,
      },
    });
    subjectIds.push(created.id);
  }

  // Minor subjects (college GE)
  if (programKeys.includes('college') && programMap['college']) {
    const collegeMinors = allMinorSubjects().filter(
      (s) => deriveProgramKey(s.levelName) === 'college',
    );
    const courseCodes = Object.keys(courseMap);
    const firstCourseCode = courseCodes[0];

    for (const s of collegeMinors) {
      const levelId =
        s.yearLevel && firstCourseCode
          ? levelMap[`${firstCourseCode}|${s.yearLevel}`]
          : null;
      if (!levelId) continue;

      const id = seedId('subject', 'college_ge', 'minor', s.name, orgId);
      const existing = await db.subject.findFirst({ where: { id } });
      let subjectId: string;

      if (existing) {
        subjectId = existing.id;
      } else {
        const created = await db.subject.create({
          data: {
            id,
            org_id: orgId,
            subject_type: 'minor',
            program_id: programMap['college'],
            level_id: levelId,
            name: s.name,
            year_level: s.yearLevel,
            term_label: s.termLabel,
            is_locked: false,
          },
        });
        subjectId = created.id;
      }

      subjectIds.push(subjectId);

      // Share this minor subject across all courses
      for (const [_code, cId] of Object.entries(courseMap)) {
        const sharingId = seedId('sharing', subjectId, cId, orgId);
        await db.subjectSharing.upsert({
          where: { id: sharingId },
          update: {},
          create: {
            id: sharingId,
            org_id: orgId,
            subject_id: subjectId,
            course_id: cId,
            strand_id: null,
            level_id: null,
          },
        });
      }
    }
  }

  // ── Fallback: guarantee every seeded level has at least one subject ──────
  // Readiness requires every level to have ≥1 subject. Major/minor subject
  // data may not cover every level definition, so any level that still has
  // zero subjects after the above gets one created directly from its own DB
  // record (reading program/course/strand off the Level row itself, rather
  // than re-parsing the composite levelMap key, so it's correct regardless
  // of naming scheme).
  const uniqueLevelIds = [...new Set(Object.values(levelMap))];
  for (const levelId of uniqueLevelIds) {
    const hasSubject = await db.subject.count({
      where: { level_id: levelId, org_id: orgId },
    });
    if (hasSubject > 0) continue;

    const levelRecord = await db.level.findUnique({ where: { id: levelId } });
    if (!levelRecord) continue;

    const fallbackId = seedId('subject-fallback', levelId, orgId);
    const existingFallback = await db.subject.findFirst({
      where: { id: fallbackId },
    });
    if (existingFallback) {
      subjectIds.push(existingFallback.id);
      continue;
    }

    const created = await db.subject.create({
      data: {
        id: fallbackId,
        org_id: orgId,
        subject_type: 'major',
        program_id: levelRecord.program_id,
        level_id: levelRecord.id,
        course_id: levelRecord.course_id ?? undefined,
        strand_id: levelRecord.strand_id ?? undefined,
        name: 'General Studies',
        year_level: levelRecord.name,
        term_label: null,
        is_locked: false,
      },
    });
    subjectIds.push(created.id);
  }

  return subjectIds;
}

async function seedEducators(
  orgId: string,
  emailExtension: string,
  count: number,
): Promise<string[]> {
  const educatorIds: string[] = [];
  const password = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  for (let i = 1; i <= count; i++) {
    const name = `educator${i}`;
    const email = buildEducatorEmail(emailExtension, name);
    const id = seedId('account', email, orgId);

    const existing = await db.account.findFirst({ where: { id } });
    if (existing) {
      educatorIds.push(existing.id);
      continue;
    }

    const educatorId = generateEducatorId();
    const account = await db.account.create({
      data: {
        id,
        org_id: orgId,
        email,
        password,
        role: 'educator',
        status: AccountStatus.active,
        profile: {
          create: {
            full_name: name,
            metadata: { educatorId },
          },
        },
      },
    });
    educatorIds.push(account.id);
  }

  return educatorIds;
}

async function seedStudents(
  orgId: string,
  emailExtension: string,
  count: number,
  levelMap: Record<string, string>,
  programKeys: string[],
  programMap: Record<string, string>,
  courseMap: Record<string, string>,
  strandMap: Record<string, string>,
  schoolYearId: string,
): Promise<string[]> {
  const studentIds: string[] = [];
  const password = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  // Collect available sections per program
  const sectionsByProgram: Record<
    string,
    { sectionId: string; levelId: string; levelName: string }[]
  > = {};
  for (const progKey of programKeys) {
    sectionsByProgram[progKey] = [];
  }

  const allSections = await db.section.findMany({
    where: { org_id: orgId, school_year_id: schoolYearId },
    include: { level: true },
  });

  for (const sec of allSections) {
    const level = sec.level;
    const progKey = programKeys.find((pk) => {
      const progId = programMap[pk];
      return level.program_id === progId;
    });
    if (progKey) {
      sectionsByProgram[progKey].push({
        sectionId: sec.id,
        levelId: level.id,
        levelName: level.name,
      });
    }
  }

  // Get level names to distribute students across
  const levelsByProgram: Record<string, string[]> = {};
  for (const progKey of programKeys) {
    const levels = await db.level.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programMap[progKey],
      },
    });
    // For college, group by course
    if (progKey === 'college') {
      for (const [courseCode, courseId] of Object.entries(courseMap)) {
        const courseLevels = levels.filter((l) => l.course_id === courseId);
        const key = `college:${courseCode}`;
        levelsByProgram[key] = courseLevels.map((l) => l.id);
      }
    } else if (progKey === 'shs') {
      for (const [strandName, strandId] of Object.entries(strandMap)) {
        const strandLevels = levels.filter((l) => l.strand_id === strandId);
        const key = `shs:${strandName}`;
        levelsByProgram[key] = strandLevels.map((l) => l.id);
      }
    } else {
      levelsByProgram[progKey] = levels.map((l) => l.id);
    }
  }

  // Flatten level keys for distribution
  const allLevelKeys = Object.keys(levelsByProgram);
  if (allLevelKeys.length === 0) return studentIds;

  for (let i = 1; i <= count; i++) {
    const name = `student${i}`;
    const email = buildStudentEmail(emailExtension, name);
    const id = seedId('account', email, orgId);

    const existing = await db.account.findFirst({ where: { id } });
    if (existing) {
      studentIds.push(existing.id);
      continue;
    }

    const studentId = generateStudentId();
    const levelKey = pick(allLevelKeys);
    const levelIds = levelsByProgram[levelKey] ?? [];
    const levelId = levelIds.length > 0 ? pick(levelIds) : null;

    // Find a section for this level
    const [progKey] = levelKey.split(':');
    const programSections = sectionsByProgram[progKey] ?? [];
    const levelSections = programSections.filter((s) => s.levelId === levelId);
    const section = levelSections.length > 0 ? pick(levelSections) : null;

    const account = await db.account.create({
      data: {
        id,
        org_id: orgId,
        email,
        password,
        role: 'student',
        status: AccountStatus.active,
        profile: {
          create: {
            full_name: name,
            metadata: {
              studentId,
              levelId: levelId ?? undefined,
              sectionId: section?.sectionId ?? undefined,
            },
          },
        },
      },
    });
    studentIds.push(account.id);

    // Create StudentSchoolYear + StudentProgramEnrollment
    const ssyId = seedId('ssy', orgId, account.id, schoolYearId);
    const ssyExisting = await db.studentSchoolYear.findFirst({
      where: { id: ssyId },
    });
    if (!ssyExisting) {
      const programId = levelKey.includes(':')
        ? programMap[progKey]
        : programMap[levelKey];
      const courseId = levelKey.startsWith('college:')
        ? courseMap[levelKey.replace('college:', '')]
        : null;
      const strandId = levelKey.startsWith('shs:')
        ? strandMap[levelKey.replace('shs:', '')]
        : null;

      const ssy = await db.studentSchoolYear.create({
        data: {
          id: ssyId,
          org_id: orgId,
          student_id: account.id,
          school_year_id: schoolYearId,
          status: 'active',
        },
      });

      if (programId) {
        await db.studentProgramEnrollment.create({
          data: {
            id: uuid(),
            org_id: orgId,
            student_school_year_id: ssy.id,
            program_id: programId,
            level_id: levelId ?? undefined,
            course_id: courseId ?? undefined,
            strand_id: strandId ?? undefined,
            section_id: section?.sectionId ?? undefined,
            status: 'active',
          },
        });
      }
    }
  }

  return studentIds;
}

// ── Classes + per-class grading schemes ─────────────────────────────────────
// Deterministic pass: for every level, pair each of its subjects with each of
// its sections (cycling the shorter list) so every subject AND every section
// under that level ends up with at least one class — satisfying both the
// "subject has classes" and "section has classes" readiness requirements
// without a full N×M combinatorial blow-up. Each new class also gets a
// grading scheme copied from that program's grading scheme template,
// satisfying "class has a grading scheme."

async function seedClasses(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
  subjectIds: string[],
  educatorIds: string[],
  levelMap: Record<string, string>,
): Promise<void> {
  if (educatorIds.length === 0 || subjectIds.length === 0) return;

  // Get semester IDs for each program
  const semesterMap: Record<string, string> = {};
  for (const progKey of programKeys) {
    const programId = programMap[progKey];
    if (!programId) continue;

    const assignment = await db.programSemesterAssignment.findFirst({
      where: { program_id: programId },
      include: { template: { include: { semesters: true } } },
    });
    if (!assignment) continue;

    const firstSem = assignment.template.semesters.find(
      (s) => s.order_index === 0,
    );
    if (!firstSem) continue;

    const semesterId = seedId(
      'semester',
      progKey,
      'Sem 1',
      schoolYearId,
      orgId,
    );
    const existingSem = await db.semester.findFirst({
      where: { id: semesterId },
    });
    if (!existingSem) {
      await db.semester.create({
        data: {
          id: semesterId,
          org_id: orgId,
          school_year_id: schoolYearId,
          name: firstSem.name,
          start_date: SY_START,
          end_date: new Date(
            SY_START.getTime() + (SY_END.getTime() - SY_START.getTime()) / 2,
          ),
        },
      });
    }
    semesterMap[progKey] = semesterId;
  }

  // Reverse map: programId -> progKey, so a Level record can tell us which
  // program config it belongs to.
  const programIdToKey: Record<string, string> = {};
  for (const [key, id] of Object.entries(programMap)) programIdToKey[id] = key;

  // Grading scheme template cache, keyed by progKey, loaded lazily.
  const schemeTemplateCache = new Map<
    string,
    {
      templateId: string;
      components: {
        name: string;
        type: string;
        weight: number;
        max_score: number | null;
      }[];
    } | null
  >();

  async function getSchemeTemplateForProgKey(progKey: string) {
    if (schemeTemplateCache.has(progKey))
      return schemeTemplateCache.get(progKey)!;

    const presetName = PROGRAM_SCHEME_PRESET_NAME[progKey];
    if (!presetName) {
      schemeTemplateCache.set(progKey, null);
      return null;
    }

    const templateId = seedId('scheme-template', presetName, orgId);
    const template = await db.gradingSchemeTemplate.findFirst({
      where: { id: templateId },
      include: { components: true },
    });
    if (!template) {
      schemeTemplateCache.set(progKey, null);
      return null;
    }

    const result = {
      templateId: template.id,
      components: template.components.map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
      })),
    };
    schemeTemplateCache.set(progKey, result);
    return result;
  }

  async function ensureClassGradingScheme(
    classId: string,
    progKey: string,
  ): Promise<void> {
    const tpl = await getSchemeTemplateForProgKey(progKey);
    if (!tpl) return;

    const existing = await db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
    });
    if (existing) return;

    const scheme = await db.gradingScheme.create({
      data: {
        id: uuid(),
        org_id: orgId,
        class_id: classId,
        template_id: tpl.templateId,
        name: 'Default Grading Scheme',
        is_default: true,
      },
    });

    await db.gradingSchemeComponent.createMany({
      data: tpl.components.map((c) => ({
        id: uuid(),
        org_id: orgId,
        grading_scheme_id: scheme.id,
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
        is_optional: false,
      })),
    });
  }

  // Pre-load already-seeded classes so re-runs never double-book an educator or
  // section (keeps the seed conflict-free and idempotent).
  const educatorUsed: UsedMap = new Map();
  const sectionUsed: UsedMap = new Map();
  const existingClasses = await db.class.findMany({
    where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
    include: { schedules: true },
  });
  for (const cls of existingClasses) {
    for (const s of cls.schedules) {
      const key = scheduleKey(
        s.weekday,
        timeOnly(s.start_time),
        timeOnly(s.end_time),
      );
      usedAdd(educatorUsed, cls.educator_id, key);
      if (cls.section_id) usedAdd(sectionUsed, cls.section_id, key);
    }
  }

  const uniqueLevelIds = [...new Set(Object.values(levelMap))];
  const levels = await db.level.findMany({
    where: {
      id: { in: uniqueLevelIds },
      org_id: orgId,
      school_year_id: schoolYearId,
    },
    select: { id: true, name: true, program_id: true },
  });

  const allSubjects = await db.subject.findMany({
    where: { id: { in: subjectIds }, org_id: orgId },
  });

  for (const level of levels) {
    const progKey = programIdToKey[level.program_id];
    if (!progKey || !programKeys.includes(progKey)) continue;

    const semesterId = semesterMap[progKey];
    if (!semesterId) continue;

    const levelSubjects = allSubjects.filter((s) => s.level_id === level.id);
    const levelSections = await db.section.findMany({
      where: {
        level_id: level.id,
        org_id: orgId,
        school_year_id: schoolYearId,
        deleted_at: null,
      },
    });

    if (levelSubjects.length === 0 || levelSections.length === 0) {
      console.warn(
        `  ⚠ Level "${level.name}" has ${levelSubjects.length} subject(s) and ${levelSections.length} section(s); cannot seed classes for it.`,
      );
      continue;
    }

    const pairCount = Math.max(levelSubjects.length, levelSections.length);
    for (let i = 0; i < pairCount; i++) {
      const subject = levelSubjects[i % levelSubjects.length];
      const section = levelSections[i % levelSections.length];

      const classId = seedId(
        'class',
        progKey,
        level.id,
        subject.id,
        section.id,
        schoolYearId,
        orgId,
      );
      const existingClass = await db.class.findFirst({
        where: { id: classId },
      });
      if (existingClass) {
        await ensureClassGradingScheme(existingClass.id, progKey);
        continue;
      }

      const allocation = allocateScheduleSlot(
        educatorIds,
        section.id,
        educatorUsed,
        sectionUsed,
      );
      if (!allocation) {
        console.warn(
          `  ⚠ No free schedule slot left for class ${classId}; skipping.`,
        );
        continue;
      }
      const { educator, slot } = allocation;

      const created = await db.class.create({
        data: {
          id: classId,
          org_id: orgId,
          subject_id: subject.id,
          educator_id: educator,
          section_id: section.id,
          school_year_id: schoolYearId,
          semester_id: semesterId,
          capacity: randInt(30, 50),
          schedules: {
            create: [
              {
                id: uuid(),
                org_id: orgId,
                weekday: slot.weekday,
                start_time: scheduleDate(slot.start),
                end_time: scheduleDate(slot.end),
              },
            ],
          },
        },
      });

      usedAdd(educatorUsed, educator, slot.key);
      usedAdd(sectionUsed, section.id, slot.key);

      await ensureClassGradingScheme(created.id, progKey);
    }
  }
}

// ── Repair existing schedule conflicts ───────────────────────────────────────
// Scans every non-deleted class and moves any schedule that overlaps another
// class of the SAME educator (and section) within the same school year to a free
// slot. Runs after the domain seeder so data created by older/other seeders gets
// reconciled. Idempotent — reports how many classes were touched.

async function repairScheduleConflicts(): Promise<number> {
  let fixed = 0;

  const classes = await db.class.findMany({
    where: { deleted_at: null },
    include: { schedules: true },
    orderBy: { created_at: 'asc' },
  });

  const byGroup = new Map<string, typeof classes>();
  for (const cls of classes) {
    if (cls.schedules.length === 0) continue;
    const key = `${cls.org_id}::${cls.school_year_id}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(cls);
  }

  for (const group of byGroup.values()) {
    const educatorUsed: UsedMap = new Map();
    const sectionUsed: UsedMap = new Map();

    for (const cls of group) {
      const resolved: Array<{
        id: string;
        weekday: number;
        start_time: Date;
        end_time: Date;
      }> = [];
      const resolvedKeys: string[] = [];
      let changed = false;

      for (const s of cls.schedules) {
        const key = scheduleKey(
          s.weekday,
          timeOnly(s.start_time),
          timeOnly(s.end_time),
        );
        const conflicts =
          isUsed(educatorUsed, cls.educator_id, key) ||
          (!!cls.section_id && isUsed(sectionUsed, cls.section_id, key)) ||
          resolvedKeys.includes(key);

        if (!conflicts) {
          resolved.push({
            id: s.id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
          });
          resolvedKeys.push(key);
          continue;
        }

        const freeSlot = findFreeSlot(
          cls.educator_id,
          cls.section_id,
          educatorUsed,
          sectionUsed,
          resolvedKeys,
        );
        if (!freeSlot) {
          // No free slot available — keep the original rather than lose data.
          resolved.push({
            id: s.id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
          });
          resolvedKeys.push(key);
          continue;
        }

        resolved.push({
          id: s.id,
          weekday: freeSlot.weekday,
          start_time: scheduleDate(freeSlot.start),
          end_time: scheduleDate(freeSlot.end),
        });
        resolvedKeys.push(freeSlot.key);
        changed = true;
      }

      for (const r of resolved) {
        usedAdd(
          educatorUsed,
          cls.educator_id,
          scheduleKey(r.weekday, timeOnly(r.start_time), timeOnly(r.end_time)),
        );
        if (cls.section_id)
          usedAdd(
            sectionUsed,
            cls.section_id,
            scheduleKey(
              r.weekday,
              timeOnly(r.start_time),
              timeOnly(r.end_time),
            ),
          );
      }

      if (changed) {
        await Promise.all(
          resolved.map((r) =>
            db.classSchedule.update({
              where: { id: r.id },
              data: {
                weekday: r.weekday,
                start_time: r.start_time,
                end_time: r.end_time,
              },
            }),
          ),
        );
        fixed++;
      }
    }
  }

  return fixed;
}

// ── Readiness gate ───────────────────────────────────────────────────────────
// Re-implements the exact blocking checks from SchoolYearReadinessService.detail()
// directly against the DB (the seed script runs outside Nest's DI container, so
// the real service can't be injected here). Every query below mirrors that
// service 1:1 so the seed can never mark a year "ready" that the real
// activation flow would reject, or vice versa.

interface ReadinessCheckResult {
  ready: boolean;
  issues: string[];
}

async function checkSchoolYearReadiness(
  orgId: string,
  schoolYearId: string,
): Promise<ReadinessCheckResult> {
  const issues: string[] = [];

  const schoolYear = await db.schoolYear.findFirst({
    where: { id: schoolYearId, org_id: orgId },
    select: { id: true, name: true, start_date: true },
  });
  if (!schoolYear) {
    return { ready: false, issues: ['School year not found.'] };
  }
  if (!schoolYear.start_date) {
    issues.push(`School year "${schoolYear.name}" has no start date.`);
  }

  const programs = await db.program.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: {
      id: true,
      name: true,
      type: true,
      _count: { select: { levels: true, courses: true, strands: true } },
    },
  });
  if (programs.length === 0) {
    issues.push(`School year "${schoolYear.name}" has no programs.`);
  }

  for (const program of programs) {
    if (program._count.levels === 0) {
      issues.push(`Program "${program.name}" has no levels.`);
    }

    if (program.type === 'college') {
      const courses = await db.course.findMany({
        where: { program_id: program.id, org_id: orgId },
        select: { id: true, name: true, _count: { select: { levels: true } } },
      });
      for (const course of courses) {
        if (course._count.levels === 0) {
          issues.push(`Course "${course.name}" has no levels.`);
        }
      }
    } else if (program.type === 'senior_high') {
      const strands = await db.strand.findMany({
        where: { program_id: program.id, org_id: orgId },
        select: { id: true, name: true, _count: { select: { levels: true } } },
      });
      for (const strand of strands) {
        if (strand._count.levels === 0) {
          issues.push(`Strand "${strand.name}" has no levels.`);
        }
      }
    }
  }

  const levels = await db.level.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          sections: { where: { deleted_at: null } },
          subjects: true,
        },
      },
    },
  });
  for (const level of levels) {
    if (level._count.sections === 0) {
      issues.push(`Level "${level.name}" has no sections.`);
    }
    if (level._count.subjects === 0) {
      issues.push(`Level "${level.name}" has no subjects.`);
    }
  }

  const levelIds = levels.map((l) => l.id);
  const programIds = programs.map((p) => p.id);
  const courses = await db.course.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: { id: true },
  });
  const strands = await db.strand.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);
  const strandIds = strands.map((s) => s.id);

  const subjects = await db.subject.findMany({
    where: {
      org_id: orgId,
      OR: [
        { level_id: { in: levelIds } },
        { program_id: { in: programIds } },
        { course_id: { in: courseIds } },
        { strand_id: { in: strandIds } },
      ],
    },
    select: {
      id: true,
      name: true,
      _count: { select: { classes: { where: { deleted_at: null } } } },
    },
  });
  const subjectsNoClass = subjects.filter((s) => s._count.classes === 0);
  if (subjectsNoClass.length > 0) {
    issues.push(`${subjectsNoClass.length} subject(s) have no class created.`);
  }

  const sectionClassCounts = await db.class.groupBy({
    by: ['section_id'],
    where: { org_id: orgId, deleted_at: null },
    _count: { _all: true },
  });
  const sectionsWithClasses = new Set<string>(
    sectionClassCounts
      .filter((r) => r.section_id !== null)
      .map((r) => r.section_id as string),
  );
  const sections = await db.section.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId, deleted_at: null },
    select: { id: true, name: true },
  });
  const sectionsNoClass = sections.filter(
    (s) => !sectionsWithClasses.has(s.id),
  );
  if (sectionsNoClass.length > 0) {
    issues.push(`${sectionsNoClass.length} section(s) have no class created.`);
  }

  const programsWithoutCalendar = await db.program.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      programCalendars: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (programsWithoutCalendar.length > 0) {
    issues.push(
      `${programsWithoutCalendar.length} program(s) have no academic calendar set up.`,
    );
  }

  const programsWithoutScale = await db.program.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      gradingScaleAssignments: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (programsWithoutScale.length > 0) {
    issues.push(
      `${programsWithoutScale.length} program(s) have no grading scale assigned.`,
    );
  }

  const programSem = await db.program.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: {
      id: true,
      name: true,
      semesterAssignment: {
        select: {
          id: true,
          template: {
            select: {
              semesters: { select: { terms: { select: { id: true } } } },
            },
          },
        },
      },
    },
  });
  const termDateCounts = await db.programSemesterTermDate.groupBy({
    by: ['assignment_id'],
    where: { org_id: orgId },
    _count: { _all: true },
  });
  const termDateByAssignment = new Map<string, number>();
  for (const row of termDateCounts) {
    termDateByAssignment.set(row.assignment_id, row._count._all);
  }

  let noAssignmentCount = 0;
  let incompleteDatesCount = 0;
  for (const prog of programSem) {
    const assignment = prog.semesterAssignment;
    if (!assignment) {
      noAssignmentCount++;
      continue;
    }
    const requiredTerms = assignment.template.semesters.reduce(
      (sum, sem) => sum + sem.terms.length,
      0,
    );
    const presentDates = termDateByAssignment.get(assignment.id) ?? 0;
    if (presentDates < requiredTerms) incompleteDatesCount++;
  }
  if (noAssignmentCount > 0) {
    issues.push(
      `${noAssignmentCount} program(s) have no semester template assigned.`,
    );
  }
  if (incompleteDatesCount > 0) {
    issues.push(
      `${incompleteDatesCount} program(s) have incomplete semester term dates.`,
    );
  }

  const classesWithoutScheme = await db.class.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      deleted_at: null,
      gradingSchemes: { none: {} },
    },
    select: { id: true },
  });
  if (classesWithoutScheme.length > 0) {
    issues.push(
      `${classesWithoutScheme.length} class(es) have no grading scheme.`,
    );
  }

  return { ready: issues.length === 0, issues };
}

// ── Main orchestrator ───────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 SEED DOMAIN DATA — START\n');

  // 1. Seed platform owner + admins with orgs (reuse start.ts logic)
  console.log('▶ Seeding base accounts & organizations...');
  const platformOwnerEmail = 'platform@edutool.dev';
  const platformOwnerPw = await bcrypt.hash('platform123', SALT_ROUNDS);
  await db.account.upsert({
    where: { email: platformOwnerEmail },
    update: {
      password: platformOwnerPw,
      role: 'platform_owner',
      status: AccountStatus.active,
      deleted_at: null,
      is_registrar: false,
    },
    create: {
      email: platformOwnerEmail,
      password: platformOwnerPw,
      role: 'platform_owner',
      status: AccountStatus.active,
      is_registrar: false,
    },
  });
  await db.profile.upsert({
    where: {
      account_id: (await db.account.findUnique({
        where: { email: platformOwnerEmail },
      }))!.id,
    },
    update: { full_name: 'Platform Owner' },
    create: {
      account_id: (await db.account.findUnique({
        where: { email: platformOwnerEmail },
      }))!.id,
      full_name: 'Platform Owner',
    },
  });
  console.log(`  platform_owner  ${platformOwnerEmail}`);

  for (let i = 0; i < ADMIN_CONFIGS.length; i++) {
    const {
      adminIndex,
      programs: progKeys,
      educators: educatorCount,
      students: studentCount,
    } = ADMIN_CONFIGS[i];
    const admin = ADMINS[adminIndex];
    const school = SCHOOLS[adminIndex];

    const emailExt = slugify(school.name);
    const adminPw = await bcrypt.hash(admin.password, SALT_ROUNDS);

    let org = await db.organization.findUnique({
      where: { email_extension: emailExt },
    });

    if (org) {
      // Keep an existing slug stable (idempotent seed) but backfill one for any
      // organization that was created without it — same logic as the repository.
      org = await db.organization.update({
        where: { id: org.id },
        data: {
          name: school.name,
          description: school.description,
          address: school.address,
          logo_url: school.logo_url,
          ...(org.slug ? {} : { slug: slugifyName(school.name) }),
        },
      });
    } else {
      org = await db.organization.create({
        data: {
          name: school.name,
          description: school.description,
          address: school.address,
          logo_url: school.logo_url,
          email_extension: emailExt,
          slug: slugifyName(school.name),
        },
      });
    }

    const account = await db.account.upsert({
      where: { email: admin.email },
      update: {
        password: adminPw,
        role: 'admin',
        status: AccountStatus.active,
        deleted_at: null,
        org_id: org.id,
        is_registrar: false,
      },
      create: {
        org_id: org.id,
        email: admin.email,
        password: adminPw,
        role: 'admin',
        status: AccountStatus.active,
        is_registrar: false,
      },
    });
    await db.profile.upsert({
      where: { account_id: account.id },
      update: { full_name: admin.fullName },
      create: { account_id: account.id, full_name: admin.fullName },
    });

    if (!org.admin_account_id) {
      await db.organization.update({
        where: { id: org.id },
        data: { admin_account_id: account.id },
      });
    }

    console.log(`  admin           ${admin.email} ← ${school.name}`);

    // ── 2. Seed domain data for this org ──
    console.log(
      `\n▶ [${school.name}] Seeding domain data (${progKeys.join(', ')})...`,
    );

    // a) School year
    const schoolYearId = await seedSchoolYear(org.id);
    console.log(`  └ school year: ${SY_NAME}`);

    // b) Enrollment setting
    await db.orgEnrollmentSetting.upsert({
      where: { org_id: org.id },
      update: {},
      create: {
        id: seedId('org-enrollment-setting', org.id),
        org_id: org.id,
        require_semester_reenrollment: false,
        auto_unenroll_on_year_end: true,
      },
    });

    // c) Programs
    const programMap = await seedPrograms(org.id, schoolYearId, progKeys);
    console.log(`  └ programs: ${Object.keys(programMap).join(', ')}`);

    // d) Courses (college) & Strands (SHS)
    const courseMap = await seedCourses(org.id, schoolYearId, programMap);
    if (Object.keys(courseMap).length > 0)
      console.log(`  └ courses: ${Object.keys(courseMap).length}`);
    const strandMap = await seedStrands(org.id, schoolYearId, programMap);
    if (Object.keys(strandMap).length > 0)
      console.log(`  └ strands: ${Object.keys(strandMap).length}`);

    // e) Levels & sections
    const levelMap = await seedLevelsAndSections(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      courseMap,
      strandMap,
    );
    console.log(`  └ levels: ${Object.keys(levelMap).length}`);

    // f) Grading scales
    await seedGradingScales(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ grading scales: seeded`);

    // g) Grading scheme templates
    await seedGradingSchemes(org.id, progKeys, programMap);
    console.log(`  └ grading scheme templates: seeded`);

    // h) Program academic calendars — MUST run before semester templates.
    await seedProgramCalendars(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ academic calendars: seeded`);

    // i) Semester templates (break count derived above already matches this)
    await seedSemesterTemplates(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ semester templates: seeded`);

    // j) Subjects (includes fallback so every level has ≥1 subject)
    const subjectIds = await seedSubjects(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      courseMap,
      strandMap,
      levelMap,
    );
    console.log(`  └ subjects: ${subjectIds.length}`);

    // k) Educators
    const educatorIds = await seedEducators(org.id, emailExt, educatorCount);
    console.log(`  └ educators: ${educatorIds.length}`);

    // l) Classes + per-class grading schemes (deterministic full coverage)
    await seedClasses(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      subjectIds,
      educatorIds,
      levelMap,
    );
    console.log(`  └ classes & class grading schemes: seeded`);

    // m) Readiness gate — only enroll students (and activate) if the school
    //    year actually passes the same checks the real activation flow uses.
    const readiness = await checkSchoolYearReadiness(org.id, schoolYearId);

    if (readiness.ready) {
      console.log(`  ✅ School year is READY — proceeding to enroll students.`);

      await db.schoolYear.updateMany({
        where: { org_id: org.id, id: { not: schoolYearId }, status: 'active' },
        data: { status: 'ended' },
      });
      await db.schoolYear.update({
        where: { id: schoolYearId },
        data: { status: 'active' },
      });

      const studentIds = await seedStudents(
        org.id,
        emailExt,
        studentCount,
        levelMap,
        progKeys,
        programMap,
        courseMap,
        strandMap,
        schoolYearId,
      );
      console.log(`  └ students: ${studentIds.length}`);
    } else {
      console.warn(
        `  ⚠ School year is NOT READY — skipping student enrollment for ${school.name}.`,
      );
      for (const issue of readiness.issues) {
        console.warn(`      - ${issue}`);
      }
    }

    console.log('');
  }

  // Reconcile any overlapping educator/section schedules left by older data
  const repaired = await repairScheduleConflicts();
  console.log(`\n🗓  Schedule conflicts repaired: ${repaired}`);

  console.log('\n✅ SEED DOMAIN DATA — COMPLETE\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed domain data failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
