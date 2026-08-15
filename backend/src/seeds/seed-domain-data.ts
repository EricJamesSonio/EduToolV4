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
 */

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
import { slugifyName } from '@/modules/organization/organization.repository'; 

import { SCHOOLS } from './data/schools';
import { ADMINS } from './data/admins';

// ── Constants ──────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'seed123';
const SY_START = new Date('2025-07-01');
const SY_END = new Date('2026-06-30');
const SY_NAME = 'SY 2025-2026';

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
  programMap: Record<string, string>,
): Promise<void> {
  const schemeProgram: Record<string, string> = {
    'Daycare Scheme': 'daycare',
    'Kindergarten Scheme': 'kinder',
    'Elementary Scheme': 'elementary',
    'High School Scheme': 'jhs',
    'Senior High School Scheme': 'shs',
    'College Scheme': 'college',
  };

  for (const preset of SCHEME_PRESETS) {
    const progKey = schemeProgram[preset.name];
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
      for (const [code, cId] of Object.entries(courseMap)) {
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

    // Create a Semester record in the Semester table
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

  // Get all sections
  const allSections = await db.section.findMany({
    where: { org_id: orgId, school_year_id: schoolYearId },
  });

  // Get all subjects
  const allSubjects = await db.subject.findMany({
    where: { id: { in: subjectIds }, org_id: orgId },
  });

  // Group subjects by program
  const subjectsByProgram: Record<string, typeof allSubjects> = {};
  for (const subj of allSubjects) {
    const progId = subj.program_id;
    if (!progId) continue;
    const progKey = Object.entries(programMap).find(
      ([, id]) => id === progId,
    )?.[0];
    if (!progKey) continue;
    if (!subjectsByProgram[progKey]) subjectsByProgram[progKey] = [];
    subjectsByProgram[progKey].push(subj);
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

  for (const progKey of programKeys) {
    const semesterId = semesterMap[progKey];
    if (!semesterId) continue;

    const progSubjects = subjectsByProgram[progKey] ?? [];
    if (progSubjects.length === 0) continue;

    const classCount = randInt(3, 5);
    for (let c = 0; c < classCount; c++) {
      const subject = pick(progSubjects);
      const section = allSections.length > 0 ? pick(allSections) : null;

      const classId = seedId(
        'class',
        progKey,
        subject.id,
        String(c),
        schoolYearId,
        orgId,
      );
      const existingClass = await db.class.findFirst({
        where: { id: classId },
      });
      if (existingClass) continue;

      // Reserve a slot that does not collide with the educator's or section's
      // existing classes within this school year.
      const allocation = allocateScheduleSlot(
        educatorIds,
        section?.id ?? null,
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

      await db.class.create({
        data: {
          id: classId,
          org_id: orgId,
          subject_id: subject.id,
          educator_id: educator,
          section_id: section?.id ?? undefined,
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
      if (section) usedAdd(sectionUsed, section.id, slot.key);
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

    const org = await db.organization.upsert({
      where: { email_extension: emailExt },
      update: {
        name: school.name,
        address: school.address,
        logo_url: school.logo_url,
        slug: slugifyName(school.name), // ✅ keep consistent with repo
      },
      create: {
        name: school.name,
        address: school.address,
        logo_url: school.logo_url,
        email_extension: emailExt,
        slug: slugifyName(school.name), // ✅ SAME logic as repository
      },
    });

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

    // h) Semester templates
    await seedSemesterTemplates(org.id, schoolYearId, progKeys, programMap);
    console.log(`  └ semester templates: seeded`);

    // i) Subjects
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

    // j) Educators
    const educatorIds = await seedEducators(org.id, emailExt, educatorCount);
    console.log(`  └ educators: ${educatorIds.length}`);

    // k) Students
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

    // l) Classes
    await seedClasses(
      org.id,
      schoolYearId,
      progKeys,
      programMap,
      subjectIds,
      educatorIds,
      levelMap,
    );
    console.log(`  └ classes: seeded`);
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
