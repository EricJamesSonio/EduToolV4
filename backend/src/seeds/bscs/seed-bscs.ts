import 'reflect-metadata';

import * as bcrypt from 'bcrypt';
import { AccountStatus, Prisma } from '@prisma/client';

import { db } from '../domain/db';
import { SALT_ROUNDS, SEED_PASSWORD } from '../domain/constants';
import { checkSchoolYearReadiness } from '../domain/readiness-check';
import {
  buildEducatorEmail,
  buildStudentEmail,
  generateEducatorId,
  generateStudentId,
  slugify,
} from '../domain/utils/identity.util';
import { seedId } from '../../modules/org-seeder/seed-id';
import { SCALE_COLLEGE } from '../../modules/org-seeder/data/grading-scale.data';
import { SCHEME_PRESETS } from '../../modules/org-seeder/data/grading-schemes.data';
import { hhmmToScheduleDate } from '../../commons/utils/schedule-time.util';

import {
  COLLEGE_SCALE_NAME,
  COURSE,
  DEFAULT_STUDENT_SECTION,
  ENROLL_STUDENTS_IN_CLASSES,
  IRREGULAR_EXTRA_SECTIONS,
  IRREGULAR_RATE_PERCENT,
  IRREGULAR_STUDENTS,
  LEGACY_SECTION_NAMES,
  RAW_STUDENT_NAMES,
  REGULAR_STUDENTS,
  SCHEDULES,
  SECTIONS,
  SEMESTER_BREAK_DAYS,
  SEMESTER_BREAK_LABEL,
  SEMESTER_NAMES,
  SEMESTER_TEMPLATE_NAME,
  SEMESTER_TERM_NAMES,
  WEEKDAY_NUMBER,
  type ScheduleDef,
} from './bscs.data';
import { scheduleDateToMinutes } from '../../commons/utils/schedule-time.util';
import {
  CLASS_DAYS,
  CURRICULUM,
  FULL_BLOCKS,
  HALF_BLOCKS,
  POSTED_TIMETABLE_SEMESTER,
  ROOM_POOLS,
  STUDENT_SEMESTER,
  type CurriculumSubject,
  type TermLabel,
} from './bscs.data';
import { SEEDED_TERMS } from './bscs.data';
import { MINOR_SUBJECT_CODES } from './bscs.data';

type OrgInfo = {
  id: string;
  name: string;
  email_extension: string | null;
  slug: string | null;
};

type Ctx = {
  orgId: string;
  emailExt: string;
  schoolYearId: string;
  anchorDate: Date;
  programId: string;
  courseId: string;
};

type DateRange = {
  start: Date;
  end: Date;
};

type SeededSemester = {
  id: string;
  name: string;
  start: Date;
  end: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const TEMPLATE_INCLUDE = {
  semesters: {
    orderBy: { order_index: 'asc' },
    include: { terms: { orderBy: { order_index: 'asc' } } },
  },
} satisfies Prisma.SemesterTemplateInclude;

type TemplateWithItems = Prisma.SemesterTemplateGetPayload<{
  include: typeof TEMPLATE_INCLUDE;
}>;

const ORG_SELECT = {
  id: true,
  name: true,
  email_extension: true,
  slug: true,
} as const;

function readOption(name: string, envName: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  const value = arg ? arg.slice(prefix.length) : process.env[envName];
  return value && value.trim() ? value.trim() : undefined;
}

function describeOrg(o: OrgInfo): string {
  return `${o.name} (${o.slug ?? o.email_extension ?? o.id})`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function splitRange(range: DateRange, count: number): DateRange[] {
  const total = range.end.getTime() - range.start.getTime();
  return Array.from({ length: count }, (_, i) => ({
    start: new Date(range.start.getTime() + Math.floor((total * i) / count)),
    end: new Date(
      range.start.getTime() + Math.floor((total * (i + 1)) / count),
    ),
  }));
}

async function resolveOrg(): Promise<OrgInfo | null> {
  const adminEmail = 'admin1@edutool.dev';

  const admin = await db.account.findFirst({
    where: { email: adminEmail, role: 'admin', deleted_at: null },
    select: { id: true, org_id: true },
  });
  if (!admin) {
    console.log(`  ${adminEmail} does not exist yet, skipping.`);
    return null;
  }
  if (!admin.org_id) {
    console.log(`  ${adminEmail} has no organization yet, skipping.`);
    return null;
  }

  const org = await db.organization.findUnique({
    where: { id: admin.org_id },
    select: ORG_SELECT,
  });
  if (!org) {
    console.log(`  Organization of ${adminEmail} was not found, skipping.`);
    return null;
  }
  return org;
}

async function resolveSchoolYear(orgId: string) {
  const name = readOption('school-year', 'BSCS_SCHOOL_YEAR');
  const found = name
    ? await db.schoolYear.findFirst({ where: { org_id: orgId, name } })
    : ((await db.schoolYear.findFirst({
        where: { org_id: orgId, status: 'active' },
      })) ??
      (await db.schoolYear.findFirst({
        where: { org_id: orgId },
        orderBy: { start_date: { sort: 'desc', nulls: 'last' } },
      })));

  if (!found) {
    throw new Error(
      name
        ? `School year "${name}" was not found for this organization.`
        : 'This organization has no school year yet.',
    );
  }
  if (!found.start_date) {
    throw new Error(
      `School year "${found.name}" has no start date. Set it first.`,
    );
  }
  return found;
}

async function ensureProgram(
  orgId: string,
  schoolYearId: string,
): Promise<string> {
  const existing = await db.program.findFirst({
    where: { org_id: orgId, school_year_id: schoolYearId, type: 'college' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.program.create({
    data: {
      id: seedId('prog', 'college', schoolYearId, orgId),
      org_id: orgId,
      school_year_id: schoolYearId,
      name: 'College',
      type: 'college',
    },
  });
  return created.id;
}

async function ensureCourse(
  orgId: string,
  schoolYearId: string,
  programId: string,
): Promise<string> {
  const existing = await db.course.findFirst({
    where: { org_id: orgId, school_year_id: schoolYearId, code: COURSE.code },
    select: { id: true, deleted_at: true },
  });
  if (existing) {
    if (existing.deleted_at) {
      await db.course.update({
        where: { id: existing.id },
        data: { deleted_at: null },
      });
    }
    return existing.id;
  }

  const created = await db.course.create({
    data: {
      id: seedId('course', COURSE.code, schoolYearId, orgId),
      org_id: orgId,
      school_year_id: schoolYearId,
      program_id: programId,
      name: COURSE.name,
      code: COURSE.code,
    },
  });
  return created.id;
}

async function ensureLevel(ctx: Ctx, name: string): Promise<string> {
  const existing = await db.level.findFirst({
    where: {
      org_id: ctx.orgId,
      school_year_id: ctx.schoolYearId,
      course_id: ctx.courseId,
      name,
    },
    select: { id: true, deleted_at: true },
  });
  if (existing) {
    if (existing.deleted_at) {
      await db.level.update({
        where: { id: existing.id },
        data: { deleted_at: null },
      });
    }
    return existing.id;
  }

  const created = await db.level.create({
    data: {
      id: seedId(
        'level',
        'college',
        COURSE.code,
        name,
        ctx.schoolYearId,
        ctx.orgId,
      ),
      org_id: ctx.orgId,
      school_year_id: ctx.schoolYearId,
      program_id: ctx.programId,
      course_id: ctx.courseId,
      name,
    },
  });
  return created.id;
}

async function ensureSection(
  ctx: Ctx,
  levelId: string,
  name: string,
  capacity: number,
  orderIndex: number,
): Promise<{ id: string; capacity: number }> {
  let existing = await db.section.findFirst({
    where: { org_id: ctx.orgId, level_id: levelId, name },
    select: { id: true, capacity: true, deleted_at: true },
  });

  if (!existing) {
    const legacyName = LEGACY_SECTION_NAMES[name];
    if (legacyName) {
      const legacy = await db.section.findFirst({
        where: { org_id: ctx.orgId, level_id: levelId, name: legacyName },
        select: { id: true, capacity: true, deleted_at: true },
      });
      if (legacy) {
        await db.section.update({
          where: { id: legacy.id },
          data: { name },
        });
        existing = legacy;
      }
    }
  }

  if (existing) {
    if (existing.deleted_at) {
      await db.section.update({
        where: { id: existing.id },
        data: { deleted_at: null },
      });
    }
    return { id: existing.id, capacity: existing.capacity };
  }

  const created = await db.section.create({
    data: {
      id: seedId(
        'section',
        'bscs-timetable',
        levelId,
        name,
        ctx.schoolYearId,
        ctx.orgId,
      ),
      org_id: ctx.orgId,
      level_id: levelId,
      course_id: ctx.courseId,
      school_year_id: ctx.schoolYearId,
      name,
      capacity,
      order_index: orderIndex,
    },
  });
  return { id: created.id, capacity: created.capacity };
}

async function ensureCalendar(
  ctx: Ctx,
  syStart: Date,
  syEnd: Date,
): Promise<DateRange[]> {
  let calendar = await db.programCalendar.findFirst({
    where: {
      org_id: ctx.orgId,
      school_year_id: ctx.schoolYearId,
      program_id: ctx.programId,
    },
    include: { breaks: { orderBy: { order_index: 'asc' } } },
  });

  if (!calendar) {
    calendar = await db.programCalendar.create({
      data: {
        id: seedId('program-calendar', 'bscs', ctx.schoolYearId, ctx.orgId),
        org_id: ctx.orgId,
        school_year_id: ctx.schoolYearId,
        program_id: ctx.programId,
        start_date: syStart,
        end_date: syEnd,
        notes: 'Seeded calendar: 2 semesters with one semester break.',
      },
      include: { breaks: { orderBy: { order_index: 'asc' } } },
    });
  }

  let semesterBreak = calendar.breaks[0];
  if (!semesterBreak) {
    const span = calendar.end_date.getTime() - calendar.start_date.getTime();
    const mid = calendar.start_date.getTime() + span / 2;
    const breakStart = new Date(Math.floor(mid / DAY_MS) * DAY_MS);
    semesterBreak = await db.programCalendarBreak.create({
      data: {
        org_id: ctx.orgId,
        calendar_id: calendar.id,
        label: SEMESTER_BREAK_LABEL,
        start_date: breakStart,
        end_date: addDays(breakStart, SEMESTER_BREAK_DAYS - 1),
        order_index: 1,
      },
    });
  }

  return [
    {
      start: calendar.start_date,
      end: addDays(semesterBreak.start_date, -1),
    },
    {
      start: addDays(semesterBreak.end_date, 1),
      end: calendar.end_date,
    },
  ];
}

async function ensureSemesters(
  ctx: Ctx,
  ranges: DateRange[],
): Promise<SeededSemester[]> {
  const candidates = await db.semesterTemplate.findMany({
    where: { org_id: ctx.orgId, program_type: 'college' },
    include: TEMPLATE_INCLUDE,
  });

  const currentAssignment = await db.programSemesterAssignment.findUnique({
    where: { program_id: ctx.programId },
  });

  let template: TemplateWithItems | undefined = currentAssignment
    ? candidates.find((t) => t.id === currentAssignment.template_id)
    : undefined;

  if (!template || template.semesters.length !== ranges.length) {
    template = candidates.find((t) => t.semesters.length === ranges.length);
  }

  if (!template) {
    template = await db.semesterTemplate.create({
      data: {
        org_id: ctx.orgId,
        program_type: 'college',
        name: SEMESTER_TEMPLATE_NAME,
        semesters: {
          create: SEMESTER_NAMES.map((name, i) => ({
            org_id: ctx.orgId,
            name,
            order_index: i,
            terms: {
              create: SEMESTER_TERM_NAMES.map((termName, j) => ({
                org_id: ctx.orgId,
                name: termName,
                order_index: j,
              })),
            },
          })),
        },
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  const assignment = await db.programSemesterAssignment.upsert({
    where: { program_id: ctx.programId },
    update: { template_id: template.id },
    create: {
      id: seedId('sem-assignment', ctx.programId, ctx.orgId, ctx.schoolYearId),
      org_id: ctx.orgId,
      program_id: ctx.programId,
      template_id: template.id,
    },
  });

  const seeded: SeededSemester[] = [];

  for (let i = 0; i < template.semesters.length; i++) {
    const item = template.semesters[i];
    const range = ranges[i];
    const semesterName = /semester/i.test(item.name)
      ? item.name
      : `${item.name} Semester`;

    let semester = await db.semester.findFirst({
      where: {
        org_id: ctx.orgId,
        school_year_id: ctx.schoolYearId,
        program_id: ctx.programId,
        template_semester_id: item.id,
      },
    });
    if (!semester && i === 0) {
      semester = await db.semester.findFirst({
        where: {
          org_id: ctx.orgId,
          school_year_id: ctx.schoolYearId,
          program_id: ctx.programId,
          template_semester_id: null,
        },
        orderBy: { start_date: 'asc' },
      });
    }

    if (semester) {
      semester = await db.semester.update({
        where: { id: semester.id },
        data: {
          name: semesterName,
          start_date: range.start,
          end_date: range.end,
          template_semester_id: item.id,
        },
      });
    } else {
      semester = await db.semester.create({
        data: {
          id: seedId(
            'semester',
            'bscs',
            item.id,
            ctx.schoolYearId,
            ctx.orgId,
          ),
          org_id: ctx.orgId,
          school_year_id: ctx.schoolYearId,
          program_id: ctx.programId,
          template_semester_id: item.id,
          name: semesterName,
          start_date: range.start,
          end_date: range.end,
        },
      });
    }

    const termRanges = splitRange(range, item.terms.length);
    for (let j = 0; j < item.terms.length; j++) {
      const term = item.terms[j];
      const termRange = termRanges[j];

      const existingDate = await db.programSemesterTermDate.findFirst({
        where: { assignment_id: assignment.id, term_id: term.id },
        select: { id: true },
      });
      if (existingDate) {
        await db.programSemesterTermDate.update({
          where: { id: existingDate.id },
          data: { start_date: termRange.start, end_date: termRange.end },
        });
      } else {
        await db.programSemesterTermDate.create({
          data: {
            org_id: ctx.orgId,
            assignment_id: assignment.id,
            term_id: term.id,
            start_date: termRange.start,
            end_date: termRange.end,
          },
        });
      }

      const existingTerm = await db.term.findFirst({
        where: { semester_id: semester.id, order_index: term.order_index },
        select: { id: true },
      });
      if (existingTerm) {
        await db.term.update({
          where: { id: existingTerm.id },
          data: {
            name: term.name,
            start_date: termRange.start,
            end_date: termRange.end,
          },
        });
      } else {
        await db.term.create({
          data: {
            org_id: ctx.orgId,
            semester_id: semester.id,
            name: term.name,
            order_index: term.order_index,
            start_date: termRange.start,
            end_date: termRange.end,
          },
        });
      }
    }

    seeded.push({
      id: semester.id,
      name: semester.name,
      start: range.start,
      end: range.end,
    });
  }

  return seeded;
}

async function ensureGradingScale(ctx: Ctx): Promise<void> {
  let scale = await db.gradingScale.findFirst({
    where: { org_id: ctx.orgId, name: COLLEGE_SCALE_NAME },
  });
  if (!scale) {
    scale = await db.gradingScale.create({
      data: {
        id: seedId('scale', 'college', COLLEGE_SCALE_NAME, ctx.orgId),
        org_id: ctx.orgId,
        name: COLLEGE_SCALE_NAME,
        program_type: 'college',
        ranges: SCALE_COLLEGE as unknown as Prisma.InputJsonValue,
        is_locked: false,
      },
    });
  }

  const assignment = await db.gradingScaleAssignment.findFirst({
    where: { program_id: ctx.programId, school_year_id: ctx.schoolYearId },
    select: { id: true },
  });
  if (!assignment) {
    await db.gradingScaleAssignment.create({
      data: {
        id: seedId(
          'assign',
          'college',
          COLLEGE_SCALE_NAME,
          ctx.schoolYearId,
          ctx.programId,
          ctx.orgId,
        ),
        org_id: ctx.orgId,
        grading_scale_id: scale.id,
        program_id: ctx.programId,
        school_year_id: ctx.schoolYearId,
      },
    });
  }
}

function getCollegePreset() {
  const preset = SCHEME_PRESETS.find((p) => p.programType === 'college');
  if (!preset) {
    throw new Error('College grading scheme preset was not found.');
  }
  return preset;
}

async function ensureGradingSchemeTemplate(ctx: Ctx): Promise<string> {
  const preset = getCollegePreset();

  let template = await db.gradingSchemeTemplate.findFirst({
    where: { org_id: ctx.orgId, name: preset.name },
  });
  if (!template) {
    template = await db.gradingSchemeTemplate.create({
      data: {
        id: seedId('scheme-template', preset.name, ctx.orgId),
        org_id: ctx.orgId,
        name: preset.name,
        program_type: 'college',
        components: {
          create: preset.components.map((c) => ({
            org_id: ctx.orgId,
            name: c.name,
            type: String(c.type),
            weight: c.weight,
          })),
        },
      },
    });
  }

  const assignment = await db.gradingSchemeProgramAssignment.findFirst({
    where: { program_id: ctx.programId, school_year_id: ctx.schoolYearId },
    select: { id: true },
  });
  if (!assignment) {
    await db.gradingSchemeProgramAssignment.create({
      data: {
        org_id: ctx.orgId,
        program_id: ctx.programId,
        school_year_id: ctx.schoolYearId,
        template_id: template.id,
      },
    });
  }

  return template.id;
}

async function ensureClassGradingSchemes(
  ctx: Ctx,
  classIds: string[],
  templateId: string,
): Promise<number> {
  const preset = getCollegePreset();

  const withScheme = await db.gradingScheme.findMany({
    where: { org_id: ctx.orgId, class_id: { in: classIds } },
    select: { class_id: true },
  });
  const covered = new Set(withScheme.map((s) => s.class_id));

  let created = 0;
  for (const classId of classIds) {
    if (covered.has(classId)) continue;
    await db.gradingScheme.create({
      data: {
        org_id: ctx.orgId,
        class_id: classId,
        template_id: templateId,
        name: preset.name,
        is_default: true,
        components: {
          create: preset.components.map((c) => ({
            org_id: ctx.orgId,
            name: c.name,
            type: String(c.type),
            weight: c.weight,
            is_optional: c.isOptional,
          })),
        },
      },
    });
    created += 1;
  }
  return created;
}

function termOrder(term: TermLabel): number {
  if (term === '1st Semester') return 0;
  if (term === '2nd Semester') return 1;
  return 2;
}

function termPosition(levelName: string, term: TermLabel): number {
  const year = Number.parseInt(levelName, 10);
  return (year - 1) * 3 + termOrder(term);
}

function subjectDisplayName(subject: CurriculumSubject): string {
  return `${subject.code} - ${subject.name}`;
}

function validateCurriculum(): void {
  const problems: string[] = [];
  const byCode = new Map<string, CurriculumSubject>();
  const levelNames = new Set(SECTIONS.map((s) => s.levelName));

  for (const s of CURRICULUM) {
    if (byCode.has(s.code)) problems.push(`duplicate subject code ${s.code}`);
    byCode.set(s.code, s);
    if (!levelNames.has(s.levelName)) {
      problems.push(`${s.code}: unknown level "${s.levelName}"`);
    }
    if (s.instructors.length === 0) {
      problems.push(`${s.code}: no instructor listed`);
    }
  }

  for (const s of CURRICULUM) {
    for (const pre of s.prerequisites) {
      const prerequisite = byCode.get(pre);
      if (!prerequisite) {
        problems.push(`${s.code}: prerequisite ${pre} does not exist`);
        continue;
      }
      if (
        termPosition(prerequisite.levelName, prerequisite.term) >=
        termPosition(s.levelName, s.term)
      ) {
        problems.push(`${s.code}: prerequisite ${pre} is not taken before it`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Curriculum in bscs.data.ts is invalid, nothing was seeded:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

function clashReasons(a: ScheduleDef, b: ScheduleDef): string[] {
  if (a.semester !== b.semester || !overlaps(a, b)) return [];
  const reasons: string[] = [];
  if (a.section === b.section) reasons.push(`section ${a.section}`);
  if (a.instructor === b.instructor) reasons.push(`instructor ${a.instructor}`);
  if (a.room && a.room === b.room) reasons.push(`room ${a.room}`);
  return reasons;
}

function generateEntry(
  subject: CurriculumSubject,
  sectionName: string,
  semester: number,
  plan: ScheduleDef[],
  avoid: ScheduleDef[] = [],
): ScheduleDef {
  const blocks = subject.halfBlock ? HALF_BLOCKS : FULL_BLOCKS;
  const rooms = ROOM_POOLS[subject.roomKind];
  const candidates: { entry: ScheduleDef; rank: number }[] = [];

  for (const day of CLASS_DAYS) {
    for (const block of blocks) {
      for (const instructor of subject.instructors) {
        for (const room of rooms) {
          candidates.push({
            entry: {
              section: sectionName,
              subject: subject.code,
              instructor,
              room,
              day,
              start: block.start,
              end: block.end,
              semester,
            },
            rank: hashString(
              `${sectionName}:${semester}:${subject.code}:${day}:${block.start}:${instructor}:${room}`,
            ),
          });
        }
      }
    }
  }
  candidates.sort((a, b) => a.rank - b.rank);

  for (const { entry } of candidates) {
    const clashes = plan.some(
      (existing) => clashReasons(existing, entry).length > 0,
    );
    if (clashes) continue;
    if (avoid.some((other) => overlaps(other, entry))) continue;
    return entry;
  }
  throw new Error(
    `No conflict-free slot was found for ${subject.code} in ${sectionName} (semester ${semester}).`,
  );
}

function buildTimetable(): ScheduleDef[] {
  const byCode = new Map(CURRICULUM.map((s) => [s.code, s] as const));
  const plan: ScheduleDef[] = [];
  const extraCodes = new Set(Object.values(IRREGULAR_STUDENTS).flat());

  for (const posted of SCHEDULES) {
    if (!byCode.has(posted.subject)) {
      throw new Error(
        `Posted timetable uses unknown subject code "${posted.subject}".`,
      );
    }
    plan.push({ ...posted, semester: POSTED_TIMETABLE_SEMESTER });
  }

  for (const section of SECTIONS) {
    for (const semester of [1, 2]) {
      const label = SEMESTER_NAMES[semester - 1];
      const required = CURRICULUM.filter(
        (s) => s.levelName === section.levelName && s.term === label,
      );
      for (const subject of required) {
        const scheduled = plan.some(
          (e) =>
            e.section === section.name &&
            e.subject === subject.code &&
            e.semester === semester,
        );
        if (scheduled) continue;

        const avoid =
          section.name === DEFAULT_STUDENT_SECTION &&
          semester === STUDENT_SEMESTER
            ? plan.filter(
                (e) =>
                  e.semester === semester &&
                  extraCodes.has(e.subject) &&
                  IRREGULAR_EXTRA_SECTIONS.includes(e.section),
              )
            : [];
        plan.push(generateEntry(subject, section.name, semester, plan, avoid));
      }
    }
  }
  return plan;
}

async function verifyNoDbConflicts(
  ctx: Ctx,
  educatorIds: string[],
  sectionIds: string[],
  roomIds: string[],
): Promise<void> {
  const classes = await db.class.findMany({
    where: {
      org_id: ctx.orgId,
      school_year_id: ctx.schoolYearId,
      deleted_at: null,
      OR: [
        { educator_id: { in: educatorIds } },
        { section_id: { in: sectionIds } },
        { schedules: { some: { room_id: { in: roomIds } } } },
      ],
    },
    select: {
      id: true,
      semester_id: true,
      educator_id: true,
      section_id: true,
      subject: { select: { name: true } },
      schedules: {
        select: {
          weekday: true,
          start_time: true,
          end_time: true,
          room_id: true,
        },
      },
    },
  });

  const rows = classes.flatMap((c) =>
    c.schedules.map((s) => ({
      classId: c.id,
      label: c.subject.name,
      semesterId: c.semester_id,
      educatorId: c.educator_id,
      sectionId: c.section_id,
      roomId: s.room_id,
      weekday: s.weekday,
      start: scheduleDateToMinutes(s.start_time),
      end: scheduleDateToMinutes(s.end_time),
    })),
  );

  const problems: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (a.classId === b.classId) continue;
      if (a.semesterId !== b.semesterId || a.weekday !== b.weekday) continue;
      if (!(a.start < b.end && b.start < a.end)) continue;

      const reasons: string[] = [];
      if (a.educatorId === b.educatorId) reasons.push('same educator');
      if (a.sectionId && a.sectionId === b.sectionId) reasons.push('same section');
      if (a.roomId && a.roomId === b.roomId) reasons.push('same room');
      if (reasons.length > 0) {
        problems.push(
          `weekday ${a.weekday} (${reasons.join(', ')}): ${a.label} and ${b.label}`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Schedule conflicts exist in the database, students were not seeded:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

async function seedPrerequisites(
  ctx: Ctx,
  subjectIds: Record<string, string>,
): Promise<number> {
  const rows: { org_id: string; subject_id: string; prerequisite_id: string }[] = [];
  for (const s of CURRICULUM) {
    if (!SEEDED_TERMS.includes(s.term)) continue;
    for (const pre of s.prerequisites) {
      rows.push({
        org_id: ctx.orgId,
        subject_id: subjectIds[s.code],
        prerequisite_id: subjectIds[pre],
      });
    }
  }

  const wanted = new Set(rows.map((r) => `${r.subject_id}|${r.prerequisite_id}`));
  const existing = await db.subjectPrerequisite.findMany({
    where: {
      org_id: ctx.orgId,
      subject_id: { in: Object.values(subjectIds) },
    },
    select: { id: true, subject_id: true, prerequisite_id: true },
  });
  const stale = existing
    .filter((e) => !wanted.has(`${e.subject_id}|${e.prerequisite_id}`))
    .map((e) => e.id);
  if (stale.length > 0) {
    await db.subjectPrerequisite.deleteMany({ where: { id: { in: stale } } });
  }

  await db.subjectPrerequisite.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return rows.length;
}

async function seedEducatorSubjects(
  ctx: Ctx,
  plan: ScheduleDef[],
  educatorIds: Record<string, string>,
  subjectIds: Record<string, string>,
  sections: Record<string, { id: string; capacity: number }>,
): Promise<number> {
  const wanted = new Map<
    string,
    { educatorId: string; subjectId: string; sectionIds: Set<string> }
  >();
  for (const e of plan) {
    const educatorId = educatorIds[e.instructor];
    const subjectId = subjectIds[e.subject];
    const key = `${educatorId}|${subjectId}`;
    const row = wanted.get(key) ?? {
      educatorId,
      subjectId,
      sectionIds: new Set<string>(),
    };
    row.sectionIds.add(sections[e.section].id);
    wanted.set(key, row);
  }

  const existing = await db.educatorSubject.findMany({
    where: {
      org_id: ctx.orgId,
      educator_id: { in: Object.values(educatorIds) },
      subject_id: { in: Object.values(subjectIds) },
    },
    select: { id: true, educator_id: true, subject_id: true },
  });
  const stale = existing
    .filter((r) => !wanted.has(`${r.educator_id}|${r.subject_id}`))
    .map((r) => r.id);
  if (stale.length > 0) {
    await db.educatorSubject.deleteMany({ where: { id: { in: stale } } });
  }

  for (const row of wanted.values()) {
    await db.educatorSubject.upsert({
      where: {
        educator_id_subject_id: {
          educator_id: row.educatorId,
          subject_id: row.subjectId,
        },
      },
      update: { section_ids: [...row.sectionIds] },
      create: {
        org_id: ctx.orgId,
        educator_id: row.educatorId,
        subject_id: row.subjectId,
        section_ids: [...row.sectionIds],
      },
    });
  }
  return wanted.size;
}

function creditCodesFor(position: number, taken: Set<string>): string[] {
  return CURRICULUM.filter(
    (s) =>
      SEEDED_TERMS.includes(s.term) &&
      termPosition(s.levelName, s.term) < position &&
      !taken.has(s.code),
  ).map((s) => s.code);
}

function assertPrerequisitesMet(
  studentName: string,
  takenCodes: string[],
  credited: Set<string>,
): void {
  const byCode = new Map(CURRICULUM.map((s) => [s.code, s] as const));
  const problems: string[] = [];
  for (const code of takenCodes) {
    for (const pre of byCode.get(code)?.prerequisites ?? []) {
      if (!credited.has(pre)) problems.push(`${code} needs ${pre}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `Prerequisites are not met for ${studentName}: ${problems.join(', ')}. Nothing was enrolled.`,
    );
  }
}
async function seedRooms(
  orgId: string,
  plan: ScheduleDef[],
): Promise<Record<string, string>> {
  const names = [
    ...new Set(plan.map((e) => e.room).filter((r): r is string => r !== null)),
  ];
  const map: Record<string, string> = {};
  for (const name of names) {
    const room = await db.room.upsert({
      where: { org_id_name: { org_id: orgId, name } },
      update: {},
      create: { org_id: orgId, name },
    });
    map[name] = room.id;
  }
  return map;
}

async function seedEducators(
  orgId: string,
  emailExt: string,
  passwordHash: string,
  plan: ScheduleDef[],
): Promise<Record<string, string>> {
  const names = [...new Set(plan.map((e) => e.instructor))];
  const map: Record<string, string> = {};

  for (const name of names) {
    const email = buildEducatorEmail(emailExt, slugify(name));
    const existing = await db.account.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      map[name] = existing.id;
      continue;
    }

    const account = await db.account.create({
      data: {
        id: seedId('account', email, orgId),
        org_id: orgId,
        email,
        password: passwordHash,
        role: 'educator',
        status: AccountStatus.active,
        profile: {
          create: {
            full_name: name,
            metadata: { educatorId: generateEducatorId() },
          },
        },
      },
    });
    map[name] = account.id;
  }
  return map;
}

async function retireUnseededSubject(
  ctx: Ctx,
  subject: CurriculumSubject,
  levelId: string,
): Promise<void> {
  const rows = await db.subject.findMany({
    where: {
      org_id: ctx.orgId,
      level_id: levelId,
      OR: [
        {
          name: {
            in: [
              subjectDisplayName(subject),
              subject.code,
              subject.name,
              ...(subject.legacyNames ?? []),
            ],
          },
        },
        { code: subject.code },
      ],
    },
    select: { id: true },
  });

  for (const row of rows) {
    await db.educatorSubject.deleteMany({ where: { subject_id: row.id } });
    await db.subjectSharing.deleteMany({ where: { subject_id: row.id } });
    await db.subjectPrerequisite.deleteMany({
      where: { OR: [{ subject_id: row.id }, { prerequisite_id: row.id }] },
    });
    await db.subjectCompletionOverride.deleteMany({
      where: { subject_id: row.id },
    });
    const used = await db.class.count({ where: { subject_id: row.id } });
    if (used === 0) {
      await db.subject.delete({ where: { id: row.id } });
    } else {
      await db.subject.update({
        where: { id: row.id },
        data: { deleted_at: new Date() },
      });
    }
  }
}
async function syncMinorSharing(
  ctx: Ctx,
  subjectId: string,
  minor: boolean,
): Promise<void> {
  const existing = await db.subjectSharing.findFirst({
    where: { subject_id: subjectId, course_id: ctx.courseId },
    select: { id: true },
  });

  if (minor && !existing) {
    await db.subjectSharing.create({
      data: {
        id: seedId('sharing', subjectId, ctx.courseId, ctx.orgId),
        org_id: ctx.orgId,
        subject_id: subjectId,
        course_id: ctx.courseId,
        strand_id: null,
        level_id: null,
      },
    });
  }
  if (!minor && existing) {
    await db.subjectSharing.delete({ where: { id: existing.id } });
  }
}
async function seedSubjects(
  ctx: Ctx,
  levelIds: Record<string, string>,
): Promise<Record<string, string>> {
  const unknownMinors = MINOR_SUBJECT_CODES.filter(
    (code) => !CURRICULUM.some((s) => s.code === code),
  );
  if (unknownMinors.length > 0) {
    throw new Error(
      `MINOR_SUBJECT_CODES has unknown subject code(s): ${unknownMinors.join(', ')}`,
    );
  }

  const map: Record<string, string> = {};

  for (const s of CURRICULUM) {
    const levelId = levelIds[s.levelName];

    if (!SEEDED_TERMS.includes(s.term)) {
      await retireUnseededSubject(ctx, s, levelId);
      continue;
    }

    const minor = MINOR_SUBJECT_CODES.includes(s.code);
    const id = seedId(
      'subject',
      'bscs-curriculum',
      s.code,
      s.levelName,
      ctx.schoolYearId,
      ctx.orgId,
    );
    const knownNames = [
      s.name,
      subjectDisplayName(s),
      s.code,
      ...(s.legacyNames ?? []),
    ];

    const existing = await db.subject.findFirst({
      where: {
        org_id: ctx.orgId,
        OR: [
          { id },
          { level_id: levelId, code: s.code },
          { level_id: levelId, name: { in: knownNames } },
        ],
      },
      select: { id: true },
    });

    const data = {
      name: s.name,
      code: s.code,
      subject_type: minor ? 'minor' : 'major',
      program_id: ctx.programId,
      level_id: levelId,
      course_id: minor ? null : ctx.courseId,
      year_level: s.levelName,
      term_label: s.term,
      deleted_at: null,
    };

    let subjectId: string;
    if (existing) {
      await db.subject.update({ where: { id: existing.id }, data });
      subjectId = existing.id;
    } else {
      const created = await db.subject.create({
        data: { id, org_id: ctx.orgId, is_locked: false, ...data },
      });
      subjectId = created.id;
    }

    map[s.code] = subjectId;
    await syncMinorSharing(ctx, subjectId, minor);
  }
  return map;
}

type ClassRef = {
  classId: string;
  sectionName: string;
  def: ScheduleDef;
};

type StudentPlan = {
  regular: boolean;
  classIds: string[];
  extras: string[];
};

async function seedClasses(
  ctx: Ctx,
  semesterIds: Record<number, string>,
  sections: Record<string, { id: string; capacity: number }>,
  subjectIds: Record<string, string>,
  educatorIds: Record<string, string>,
  roomIds: Record<string, string>,
  plan: ScheduleDef[],
): Promise<ClassRef[]> {
  const refs: ClassRef[] = [];

  for (const e of plan) {
    const section = sections[e.section];
    const subjectId = subjectIds[e.subject];
    const semesterId = semesterIds[e.semester];
    const educatorId = educatorIds[e.instructor];
    const classId = seedId(
      'class',
      'bscs-curriculum',
      section.id,
      subjectId,
      semesterId,
      ctx.schoolYearId,
      ctx.orgId,
    );

    refs.push({ classId, sectionName: e.section, def: e });

    const schedule = {
      org_id: ctx.orgId,
      weekday: WEEKDAY_NUMBER[e.day],
      start_time: hhmmToScheduleDate(e.start, ctx.anchorDate),
      end_time: hhmmToScheduleDate(e.end, ctx.anchorDate),
      room_id: e.room ? roomIds[e.room] : null,
    };

    const existing = await db.class.findFirst({
      where: { id: classId },
      select: { id: true },
    });

    if (existing) {
      await db.class.update({
        where: { id: classId },
        data: {
          subject_id: subjectId,
          educator_id: educatorId,
          section_id: section.id,
          semester_id: semesterId,
          capacity: section.capacity,
          deleted_at: null,
        },
      });
      await db.classSchedule.deleteMany({ where: { class_id: classId } });
      await db.classSchedule.create({
        data: { class_id: classId, ...schedule },
      });
      continue;
    }

    await db.class.create({
      data: {
        id: classId,
        org_id: ctx.orgId,
        subject_id: subjectId,
        educator_id: educatorId,
        section_id: section.id,
        school_year_id: ctx.schoolYearId,
        semester_id: semesterId,
        capacity: section.capacity,
        schedules: { create: [schedule] },
      },
    });
  }
  return refs;
}

function normalizeKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const LOWERCASE_PARTICLES = new Set(['de', 'del', 'dela', 'la', 'van', 'von']);

function titleCase(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_PARTICLES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function dedupeNames(raw: string[]): { names: string[]; skipped: string[] } {
  const seen = new Set<string>();
  const names: string[] = [];
  const skipped: string[] = [];
  for (const entry of raw) {
    const key = normalizeKey(entry);
    if (seen.has(key)) {
      skipped.push(entry);
      continue;
    }
    seen.add(key);
    names.push(titleCase(entry));
  }
  return { names, skipped };
}

function emailLocalPart(name: string): string {
  return normalizeKey(name)
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash * 33) ^ value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a: ScheduleDef, b: ScheduleDef): boolean {
  if (a.day !== b.day) return false;
  return (
    toMinutes(a.start) < toMinutes(b.end) &&
    toMinutes(b.start) < toMinutes(a.end)
  );
}

function pickRandomExtras(
  key: string,
  base: ClassRef[],
  pool: ClassRef[],
): ClassRef[] {
  const wanted = 1 + (hashString(`${key}:count`) % 3);
  const sorted = [...pool].sort(
    (a, b) =>
      hashString(`${key}:${a.classId}`) - hashString(`${key}:${b.classId}`),
  );
  const chosen: ClassRef[] = [];
  for (const candidate of sorted) {
    if (chosen.length >= wanted) break;
    const clashes = [...base, ...chosen].some((c) =>
      overlaps(c.def, candidate.def),
    );
    if (!clashes) chosen.push(candidate);
  }
  return chosen;
}

function buildPlans(
  names: string[],
  refs: ClassRef[],
  sectionName: string,
): Map<string, StudentPlan> {
  const base = refs.filter((r) => r.sectionName === sectionName);
  const pool = refs.filter(
    (r) =>
      r.sectionName !== sectionName &&
      IRREGULAR_EXTRA_SECTIONS.includes(r.sectionName),
  );
  const baseIds = base.map((r) => r.classId);

  const regularKeys = new Set(REGULAR_STUDENTS.map(normalizeKey));
  const explicit = new Map<string, string[]>(
    Object.entries(IRREGULAR_STUDENTS).map(
      ([n, subjects]): [string, string[]] => [normalizeKey(n), subjects],
    ),
  );

  const known = new Set(names.map(normalizeKey));
  for (const key of [...regularKeys, ...explicit.keys()]) {
    if (!known.has(key)) {
      console.warn(
        `  warning: "${key}" has a special plan but is not in the student list`,
      );
    }
  }

  const plans = new Map<string, StudentPlan>();
  const randomIrregular: string[] = [];

  for (const name of names) {
    const key = normalizeKey(name);
    let extras: ClassRef[] = [];

    if (!regularKeys.has(key)) {
      if (explicit.has(key)) {
        for (const subject of explicit.get(key) ?? []) {
          const match = pool.find((r) => r.def.subject === subject);
          if (!match) {
            console.warn(
              `  warning: subject "${subject}" for ${name} was not found in the lower-year sections`,
            );
            continue;
          }
          extras.push(match);
        }
      } else if (hashString(`${key}:kind`) % 100 < IRREGULAR_RATE_PERCENT) {
        extras = pickRandomExtras(key, base, pool);
        randomIrregular.push(name);
      }
    }

    plans.set(name, {
      regular: extras.length === 0,
      classIds: [...baseIds, ...extras.map((r) => r.classId)],
      extras: extras.map((r) => `${r.def.subject} (${r.sectionName})`),
    });
  }

  let irregularCount = [...plans.values()].filter((p) => !p.regular).length;
  const flips = randomIrregular
    .filter((n) => plans.get(n)?.regular === false)
    .sort(
      (a, b) =>
        hashString(`${normalizeKey(b)}:flip`) -
        hashString(`${normalizeKey(a)}:flip`),
    );
  while (irregularCount * 2 >= names.length && flips.length > 0) {
    const name = flips.shift() as string;
    plans.set(name, { regular: true, classIds: baseIds, extras: [] });
    irregularCount -= 1;
  }

  return plans;
}

async function seedStudents(
  ctx: Ctx,
  names: string[],
  levelId: string,
  sectionId: string,
  plans: Map<string, StudentPlan>,
  allClassIds: string[],
  passwordHash: string

,
  credits: Map<string, { taken: string[]; credited: string[] }>,
  subjectIds: Record<string, string>,
): Promise<{
  created: number;
  reused: number;
  classEnrollments: number;
  creditsAdded: number;
}> {
  let created = 0;
  let reused = 0;
  let classEnrollments = 0;
  let creditsAdded = 0;
  const usedLocals = new Set<string>();

  for (const name of names) {
    const plan = plans.get(name);
    if (!plan) continue;

    let local = emailLocalPart(name);
    let suffix = 1;
    while (usedLocals.has(local)) {
      suffix += 1;
      local = `${emailLocalPart(name)}${suffix}`;
    }
    usedLocals.add(local);

    const email = buildStudentEmail(ctx.emailExt, local);
    let accountId: string;

    const existing = await db.account.findFirst({
      where: { email },
      select: { id: true, profile: { select: { metadata: true } } },
    });
    if (existing) {
      accountId = existing.id;
      reused += 1;
      const previous = (existing.profile?.metadata ?? {}) as {
        studentId?: unknown;
      };
      await db.profile.updateMany({
        where: { account_id: accountId },
        data: {
          metadata: {
            studentId:
              typeof previous.studentId === 'string'
                ? previous.studentId
                : generateStudentId(),
            levelId,
            sectionId,
          },
        },
      });
    } else {
      const account = await db.account.create({
        data: {
          id: seedId('account', email, ctx.orgId),
          org_id: ctx.orgId,
          email,
          password: passwordHash,
          role: 'student',
          status: AccountStatus.active,
          profile: {
            create: {
              full_name: name,
              metadata: {
                studentId: generateStudentId(),
                levelId,
                sectionId,
              },
            },
          },
        },
      });
      accountId = account.id;
      created += 1;
    }

    let ssy = await db.studentSchoolYear.findFirst({
      where: {
        org_id: ctx.orgId,
        student_id: accountId,
        school_year_id: ctx.schoolYearId,
      },
    });
    if (!ssy) {
      ssy = await db.studentSchoolYear.create({
        data: {
          id: seedId('ssy', ctx.orgId, accountId, ctx.schoolYearId),
          org_id: ctx.orgId,
          student_id: accountId,
          school_year_id: ctx.schoolYearId,
          status: 'active',
        },
      });
    }

    const regularData = {
      is_regular: plan.regular,
      regular_marked_at: plan.regular ? new Date() : null,
    };

    const enrollment = await db.studentProgramEnrollment.findFirst({
      where: { org_id: ctx.orgId, student_school_year_id: ssy.id },
      select: { id: true },
    });
    if (!enrollment) {
      await db.studentProgramEnrollment.create({
        data: {
          org_id: ctx.orgId,
          student_school_year_id: ssy.id,
          program_id: ctx.programId,
          course_id: ctx.courseId,
          level_id: levelId,
          section_id: sectionId,
          section_assigned_at: new Date(),
          status: 'active',
          ...regularData,
        },
      });
    } else {
      await db.studentProgramEnrollment.update({
        where: { id: enrollment.id },
        data: {
          program_id: ctx.programId,
          course_id: ctx.courseId,
          level_id: levelId,
          section_id: sectionId,
          section_assigned_at: new Date(),
          status: 'active',
          ...regularData,
        },
      });
    }

    const credit = credits.get(name);
    if (credit) {
      const takenIds = credit.taken.map((code) => subjectIds[code]);
      const creditIds = credit.credited.map((code) => subjectIds[code]);
      await db.subjectCompletionOverride.deleteMany({
        where: {
          org_id: ctx.orgId,
          student_id: accountId,
          subject_id: { in: takenIds },
        },
      });
      const creditResult = await db.subjectCompletionOverride.createMany({
        data: creditIds.map((subjectId) => ({
          org_id: ctx.orgId,
          student_id: accountId,
          subject_id: subjectId,
          status: 'completed',
          reason: 'BSCS seed: prior coursework credit',
          source: 'manual',
        })),
        skipDuplicates: true,
      });
      creditsAdded += creditResult.count;
    }

    if (ENROLL_STUDENTS_IN_CLASSES) {
      await db.enrollment.deleteMany({
        where: {
          org_id: ctx.orgId,
          student_id: accountId,
          class_id: { in: allClassIds, notIn: plan.classIds },
        },
      });
      const result = await db.enrollment.createMany({
        data: plan.classIds.map((classId) => ({
          org_id: ctx.orgId,
          class_id: classId,
          student_id: accountId,
          status: 'active' as const,
        })),
        skipDuplicates: true,
      });
      classEnrollments += result.count;
    }
  }

  return { created, reused, classEnrollments, creditsAdded };
}

function assertNoScheduleConflicts(plan: ScheduleDef[]): void {
  const problems: string[] = [];
  const byCode = new Map(CURRICULUM.map((s) => [s.code, s] as const));
  const sectionLevel = new Map(SECTIONS.map((s) => [s.name, s.levelName] as const));
  const seen = new Set<string>();

  for (const e of plan) {
    const label = `${e.section} ${e.subject} (semester ${e.semester})`;
    const subject = byCode.get(e.subject);
    if (!subject) {
      problems.push(`${label}: unknown subject code`);
      continue;
    }
    if (!sectionLevel.has(e.section)) {
      problems.push(`${label}: unknown section`);
    } else if (sectionLevel.get(e.section) !== subject.levelName) {
      problems.push(`${label}: subject belongs to ${subject.levelName}`);
    }
    if (subject.term !== SEMESTER_NAMES[e.semester - 1]) {
      problems.push(`${label}: subject is offered in ${subject.term}`);
    }

    const key = `${e.section}|${e.subject}|${e.semester}`;
    if (seen.has(key)) problems.push(`${label}: scheduled twice`);
    seen.add(key);

    const start = toMinutes(e.start);
    const end = toMinutes(e.end);
    if (start >= end) {
      problems.push(`${label}: end time is not after start time`);
    }
    if (start < 7 * 60 || end > 17 * 60 || start % 30 !== 0 || end % 30 !== 0) {
      problems.push(
        `${label}: outside the 07:00-17:00 school window or the 30-minute grid`,
      );
    }
  }

  for (let i = 0; i < plan.length; i++) {
    for (let j = i + 1; j < plan.length; j++) {
      const a = plan[i];
      const b = plan[j];
      const reasons = clashReasons(a, b);
      if (reasons.length > 0) {
        problems.push(
          `semester ${a.semester} ${a.day} ${a.start}-${a.end} / ${b.start}-${b.end} (${reasons.join(', ')}): ${a.section} ${a.subject} and ${b.section} ${b.subject}`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Timetable has problems, nothing was seeded:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

async function retireStaleClasses(
  ctx: Ctx,
  sections: Record<string, { id: string; capacity: number }>,
  keepClassIds: string[],
): Promise<number> {
  const sectionIds = Object.values(sections).map((s) => s.id);
  const stale = await db.class.findMany({
    where: {
      org_id: ctx.orgId,
      school_year_id: ctx.schoolYearId,
      section_id: { in: sectionIds },
      deleted_at: null,
      id: { notIn: keepClassIds },
    },
    select: { id: true },
  });
  if (stale.length === 0) return 0;

  const staleIds = stale.map((c) => c.id);
  await db.enrollment.deleteMany({
    where: { org_id: ctx.orgId, class_id: { in: staleIds } },
  });
  await db.class.updateMany({
    where: { id: { in: staleIds } },
    data: { deleted_at: new Date() },
  });
  return staleIds.length;
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function assertSemesterOpenForEnrollment(
  semesters: SeededSemester[],
  target: number,
  now: Date,
): void {
  const current = semesters[target - 1];
  if (!current) {
    throw new Error(`Semester ${target} does not exist, students were not enrolled.`);
  }
  if (current.end.getTime() < now.getTime()) {
    throw new Error(
      `${current.name} ended on ${formatDay(current.end)}. Students cannot be enrolled in an ended semester.`,
    );
  }
  const blocking = semesters
    .slice(0, target - 1)
    .filter((s) => s.end.getTime() >= now.getTime());
  if (blocking.length > 0) {
    throw new Error(
      `Enrollment in ${current.name} is locked until ${blocking
        .map((s) => `${s.name} ends (${formatDay(s.end)})`)
        .join(', ')}. Students were not enrolled.`,
    );
  }
}

function assertStudentPlans(
  plans: Map<string, StudentPlan>,
  refById: Map<string, ClassRef>,
  semester: number,
): void {
  const problems: string[] = [];
  for (const [name, plan] of plans) {
    const defs = plan.classIds
      .map((id) => refById.get(id)?.def)
      .filter((d): d is ScheduleDef => Boolean(d));
    for (const d of defs) {
      if (d.semester !== semester) {
        problems.push(
          `${name}: ${d.subject} is a semester ${d.semester} class but enrollment is locked to semester ${semester}`,
        );
      }
    }
    for (let i = 0; i < defs.length; i++) {
      for (let j = i + 1; j < defs.length; j++) {
        if (defs[i].semester === defs[j].semester && overlaps(defs[i], defs[j])) {
          problems.push(
            `${name}: ${defs[i].subject} overlaps ${defs[j].subject} on ${defs[i].day}`,
          );
        }
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `Student class plans are invalid, nobody was enrolled:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

async function closeEndedSemesterEnrollments(
  ctx: Ctx,
  semesters: SeededSemester[],
  classRefs: ClassRef[],
  now: Date,
): Promise<number> {
  const endedClassIds = classRefs
    .filter((r) => semesters[r.def.semester - 1].end.getTime() < now.getTime())
    .map((r) => r.classId);
  if (endedClassIds.length === 0) return 0;

  const result = await db.enrollment.updateMany({
    where: {
      org_id: ctx.orgId,
      class_id: { in: endedClassIds },
      status: 'active',
    },
    data: {
      status: 'removed',
      outcome: 'completed',
      outcome_reason: 'Semester ended',
      outcome_set_at: now,
    },
  });
  return result.count;
}
async function main(): Promise<void> {
  console.log('\nSEED BSCS - START\n');

  validateCurriculum();
  const timetable = buildTimetable();
  assertNoScheduleConflicts(timetable);
  console.log(
    `  curriculum   : ${CURRICULUM.length} subjects, prerequisites verified`,
  );
  console.log(
    `  timetable    : ${timetable.length} classes planned, no schedule conflicts`,
  );

  const studentSection =
    readOption('section', 'BSCS_STUDENT_SECTION') ?? DEFAULT_STUDENT_SECTION;
  const studentSectionDef = SECTIONS.find((s) => s.name === studentSection);
  if (!studentSectionDef) {
    throw new Error(
      `Unknown section "${studentSection}". Use one of: ${SECTIONS.map((s) => s.name).join(', ')}`,
    );
  }

  const org = await resolveOrg();
  if (!org) {
    console.log('\nSEED BSCS - SKIPPED\n');
    return;
  }

  const schoolYear = await resolveSchoolYear(org.id);
  console.log(`  organization : ${describeOrg(org)}`);
  console.log(`  school year  : ${schoolYear.name} (${schoolYear.status})`);

  const syStart = schoolYear.start_date as Date;
  const syEnd = schoolYear.end_date ?? addDays(syStart, 300);

  const emailExt = org.email_extension ?? slugify(org.name);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  const programId = await ensureProgram(org.id, schoolYear.id);
  const courseId = await ensureCourse(org.id, schoolYear.id, programId);

  await db.orgScheduleConfig.upsert({
    where: { org_id: org.id },
    update: {},
    create: {
      org_id: org.id,
      start_time: '07:00',
      end_time: '17:00',
      slot_duration: 30,
    },
  });

  const ctx: Ctx = {
    orgId: org.id,
    emailExt,
    schoolYearId: schoolYear.id,
    anchorDate: syStart,
    programId,
    courseId,
  };

  const levelIds: Record<string, string> = {};
  for (const levelName of [...new Set(SECTIONS.map((s) => s.levelName))]) {
    levelIds[levelName] = await ensureLevel(ctx, levelName);
  }

  const sections: Record<string, { id: string; capacity: number }> = {};
  for (let i = 0; i < SECTIONS.length; i++) {
    const def = SECTIONS[i];
    sections[def.name] = await ensureSection(
      ctx,
      levelIds[def.levelName],
      def.name,
      def.capacity,
      i,
    );
  }
  console.log(`  sections     : ${Object.keys(sections).length}`);

  const semesterRanges = await ensureCalendar(ctx, syStart, syEnd);
  console.log('  calendar     : 2 semesters with 1 semester break');

  const semesters = await ensureSemesters(ctx, semesterRanges);
  if (semesters.length < 2) {
    throw new Error('The semester template must have 2 semesters.');
  }
  const semesterIds: Record<number, string> = {
    1: semesters[0].id,
    2: semesters[1].id,
  };
  for (const s of semesters) {
    console.log(
      `  semester     : ${s.name} (${s.start.toISOString().slice(0, 10)} -> ${s.end.toISOString().slice(0, 10)})`,
    );
  }

  await ensureGradingScale(ctx);
  const schemeTemplateId = await ensureGradingSchemeTemplate(ctx);
  console.log('  grading      : scale and scheme template assigned');

  const roomIds = await seedRooms(org.id, timetable);
  console.log(`  rooms        : ${Object.keys(roomIds).length}`);

  const educatorIds = await seedEducators(
    org.id,
    emailExt,
    passwordHash,
    timetable,
  );
  console.log(`  educators    : ${Object.keys(educatorIds).length}`);

  const subjectIds = await seedSubjects(ctx, levelIds);
  console.log(`  subjects     : ${Object.keys(subjectIds).length}`);

  await seedPrerequisites(ctx, subjectIds);
  const prerequisiteCount = CURRICULUM.reduce(
    (sum, s) => sum + s.prerequisites.length,
    0,
  );
  console.log(`  prerequisites: ${prerequisiteCount} links`);

  const teachable = await seedEducatorSubjects(
    ctx,
    timetable,
    educatorIds,
    subjectIds,
    sections,
  );
  console.log(`  teachable    : ${teachable} educator-subject links`);

  const classRefs = await seedClasses(
    ctx,
    semesterIds,
    sections,
    subjectIds,
    educatorIds,
    roomIds,
    timetable,
  );
  console.log(
    `  classes      : ${classRefs.length} (1st sem ${classRefs.filter((r) => r.def.semester === 1).length}, 2nd sem ${classRefs.filter((r) => r.def.semester === 2).length})`,
  );

  const retired = await retireStaleClasses(
    ctx,
    sections,
    classRefs.map((r) => r.classId),
  );
  if (retired > 0) {
    console.log(`  retired      : ${retired} old class(es) no longer in the timetable`);
  }

  await verifyNoDbConflicts(
    ctx,
    Object.values(educatorIds),
    Object.values(sections).map((s) => s.id),
    Object.values(roomIds),
  );
  console.log('  conflicts    : none in the database');

  const schemesCreated = await ensureClassGradingSchemes(
    ctx,
    classRefs.map((r) => r.classId),
    schemeTemplateId,
  );
  console.log(`  class schemes: ${schemesCreated} created`);

  const now = new Date();
  const closed = await closeEndedSemesterEnrollments(
    ctx,
    semesters,
    classRefs,
    now,
  );
  if (closed > 0) {
    console.log(
      `  unenrolled   : ${closed} enrollment(s) closed because their semester ended (records kept)`,
    );
  }

  const readiness = await checkSchoolYearReadiness(org.id, schoolYear.id);
  if (!readiness.ready) {
    console.error('\n  School year is NOT READY. Students were not seeded.');
    for (const issue of readiness.issues) {
      console.error(`    - ${issue}`);
    }
    process.exitCode = 1;
    console.log('\nSEED BSCS - STOPPED (not ready)\n');
    return;
  }
  console.log('  readiness    : school year is READY');

  assertSemesterOpenForEnrollment(semesters, STUDENT_SEMESTER, now);
  console.log(
    `  enrollment   : ${semesters[STUDENT_SEMESTER - 1].name} is open, later semesters stay locked`,
  );

  const { names, skipped } = dedupeNames(RAW_STUDENT_NAMES);
  const studentRefs = classRefs.filter(
    (r) => r.def.semester === STUDENT_SEMESTER,
  );
  const plans = buildPlans(names, studentRefs, studentSectionDef.name);

  const position = termPosition(
    studentSectionDef.levelName,
    SEMESTER_NAMES[STUDENT_SEMESTER - 1] as TermLabel,
  );
  const refById = new Map(classRefs.map((r) => [r.classId, r] as const));
  assertStudentPlans(plans, refById, STUDENT_SEMESTER);

  const credits = new Map<string, { taken: string[]; credited: string[] }>();
  for (const [name, plan] of plans) {
    const taken = plan.classIds
      .map((id) => refById.get(id)?.def.subject)
      .filter((code): code is string => Boolean(code));
    const credited = creditCodesFor(position, new Set(taken));
    assertPrerequisitesMet(name, taken, new Set(credited));
    credits.set(name, { taken, credited });
  }
  console.log('  prerequisites: met for every enrolled class');
  console.log('  student plans: in the open semester, no overlapping classes');

  const openClassIds = classRefs
    .filter((r) => semesters[r.def.semester - 1].end.getTime() >= now.getTime())
    .map((r) => r.classId);

  const targetSection = sections[studentSectionDef.name];
  const studentResult = await seedStudents(
    ctx,
    names,
    levelIds[studentSectionDef.levelName],
    targetSection.id,
    plans,
    openClassIds,
    passwordHash,
    credits,
    subjectIds,
  );

  const regularCount = [...plans.values()].filter((p) => p.regular).length;
  const irregularCount = plans.size - regularCount;
  console.log(
    `  students     : ${names.length} unique in ${studentSectionDef.name} (${studentResult.created} created, ${studentResult.reused} already existed, ${skipped.length} duplicate names skipped)`,
  );
  console.log(`  regular      : ${regularCount}`);
  console.log(`  irregular    : ${irregularCount}`);
  for (const [name, plan] of plans) {
    if (!plan.regular) {
      console.log(`    ${name} + ${plan.extras.join(', ')}`);
    }
  }
  console.log(`  class enrollments added: ${studentResult.classEnrollments}`);
  console.log(`  completion credits added: ${studentResult.creditsAdded}`);

  console.log('\nSEED BSCS - COMPLETE\n');
}

main()
  .catch((e) => {
    console.error('Seed BSCS failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });