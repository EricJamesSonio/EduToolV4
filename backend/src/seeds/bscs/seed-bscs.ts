import 'reflect-metadata';

import * as bcrypt from 'bcrypt';
import { AccountStatus } from '@prisma/client';

import { db } from '../domain/db';
import { SALT_ROUNDS, SEED_PASSWORD } from '../domain/constants';
import {
  buildEducatorEmail,
  buildStudentEmail,
  generateEducatorId,
  generateStudentId,
  slugify,
} from '../domain/utils/identity.util';
import { seedId } from '../../modules/org-seeder/seed-id';
import { hhmmToScheduleDate } from '../../commons/utils/schedule-time.util';

import {
  COURSE,
  DEFAULT_STUDENT_SECTION,
  ENROLL_STUDENTS_IN_CLASSES,
  RAW_STUDENT_NAMES,
  SCHEDULES,
  SECTIONS,
  WEEKDAY_NUMBER,
} from './bscs.data';
import {
  IRREGULAR_EXTRA_SECTIONS,
  IRREGULAR_RATE_PERCENT,
  IRREGULAR_STUDENTS,
  REGULAR_STUDENTS,
  type ScheduleDef,
} from './bscs.data';

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
  semesterId: string;
};

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

async function ensureLevel(
  ctx: Ctx,
  name: string,
): Promise<string> {
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
      id: seedId('level', 'college', COURSE.code, name, ctx.schoolYearId, ctx.orgId),
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
  const existing = await db.section.findFirst({
    where: { org_id: ctx.orgId, level_id: levelId, name },
    select: { id: true, capacity: true, deleted_at: true },
  });
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
      id: seedId('section', 'bscs-timetable', levelId, name, ctx.schoolYearId, ctx.orgId),
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

async function ensureSemester(
  orgId: string,
  schoolYearId: string,
  programId: string,
  syStart: Date | null,
  syEnd: Date | null,
): Promise<string> {
  const existing = await db.semester.findFirst({
    where: { org_id: orgId, school_year_id: schoolYearId, program_id: programId },
    orderBy: { start_date: 'asc' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const start = syStart ?? new Date();
  const end = syEnd ?? new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
  const created = await db.semester.create({
    data: {
      id: seedId('semester', 'bscs', '1st Semester', schoolYearId, orgId),
      org_id: orgId,
      school_year_id: schoolYearId,
      program_id: programId,
      name: '1st Semester',
      start_date: start,
      end_date: new Date(start.getTime() + (end.getTime() - start.getTime()) / 2),
    },
  });
  return created.id;
}

async function seedRooms(orgId: string): Promise<Record<string, string>> {
  const names = [
    ...new Set(
      SCHEDULES.map((s) => s.room).filter((r): r is string => r !== null),
    ),
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
): Promise<Record<string, string>> {
  const names = [...new Set(SCHEDULES.map((s) => s.instructor))];
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

async function seedSubjects(
  ctx: Ctx,
  levelIds: Record<string, string>,
): Promise<Record<string, string>> {
  const sectionLevel: Record<string, string> = {};
  for (const sec of SECTIONS) sectionLevel[sec.name] = sec.levelName;

  const map: Record<string, string> = {};
  for (const sch of SCHEDULES) {
    const levelName = sectionLevel[sch.section];
    const key = `${levelName}|${sch.subject}`;
    if (map[key]) continue;

    const levelId = levelIds[levelName];
    const existing = await db.subject.findFirst({
      where: {
        org_id: ctx.orgId,
        level_id: levelId,
        course_id: ctx.courseId,
        name: sch.subject,
      },
      select: { id: true },
    });
    if (existing) {
      map[key] = existing.id;
      continue;
    }

    const created = await db.subject.create({
      data: {
        id: seedId('subject', 'bscs-timetable', levelName, sch.subject, ctx.orgId),
        org_id: ctx.orgId,
        subject_type: 'major',
        program_id: ctx.programId,
        level_id: levelId,
        course_id: ctx.courseId,
        name: sch.subject,
        year_level: levelName,
        is_locked: false,
      },
    });
    map[key] = created.id;
  }
  return map;
}

async function seedClasses(
  ctx: Ctx,
  sections: Record<string, { id: string; capacity: number }>,
  subjectIds: Record<string, string>,
  educatorIds: Record<string, string>,
  roomIds: Record<string, string>,
): Promise<ClassRef[]> {
  const sectionLevel: Record<string, string> = {};
  for (const sec of SECTIONS) sectionLevel[sec.name] = sec.levelName;

  const refs: ClassRef[] = [];

  for (const sch of SCHEDULES) {
    const section = sections[sch.section];
    const subjectId = subjectIds[`${sectionLevel[sch.section]}|${sch.subject}`];
    const classId = seedId(
      'class',
      'bscs-timetable',
      section.id,
      subjectId,
      sch.day,
      sch.start,
      ctx.schoolYearId,
      ctx.orgId,
    );

    refs.push({ classId, sectionName: sch.section, def: sch });

    const existing = await db.class.findFirst({
      where: { id: classId },
      select: { id: true },
    });
    if (existing) continue;

    await db.class.create({
      data: {
        id: classId,
        org_id: ctx.orgId,
        subject_id: subjectId,
        educator_id: educatorIds[sch.instructor],
        section_id: section.id,
        school_year_id: ctx.schoolYearId,
        semester_id: ctx.semesterId,
        capacity: section.capacity,
        schedules: {
          create: [
            {
              org_id: ctx.orgId,
              weekday: WEEKDAY_NUMBER[sch.day],
              start_time: hhmmToScheduleDate(sch.start, ctx.anchorDate),
              end_time: hhmmToScheduleDate(sch.end, ctx.anchorDate),
              room_id: sch.room ? roomIds[sch.room] : undefined,
            },
          ],
        },
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
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
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
  passwordHash: string,
): Promise<{ created: number; reused: number; classEnrollments: number }> {
  let created = 0;
  let reused = 0;
  let classEnrollments = 0;
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

  return { created, reused, classEnrollments };
}

function reportOverlaps(): void {
  const toMin = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  for (let i = 0; i < SCHEDULES.length; i++) {
    for (let j = i + 1; j < SCHEDULES.length; j++) {
      const a = SCHEDULES[i];
      const b = SCHEDULES[j];
      if (a.instructor !== b.instructor || a.day !== b.day) continue;
      if (toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) {
        console.warn(
          `  warning: ${a.instructor} overlaps on ${a.day} ${a.start}-${a.end}: ${a.section} ${a.subject} and ${b.section} ${b.subject}`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('\nSEED BSCS - START\n');

  const studentSection = readOption('section', 'BSCS_STUDENT_SECTION') ?? DEFAULT_STUDENT_SECTION;
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

  const emailExt = org.email_extension ?? slugify(org.name);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  const programId = await ensureProgram(org.id, schoolYear.id);
  const courseId = await ensureCourse(org.id, schoolYear.id, programId);
  const semesterId = await ensureSemester(
    org.id,
    schoolYear.id,
    programId,
    schoolYear.start_date,
    schoolYear.end_date,
  );

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
    anchorDate: schoolYear.start_date ?? new Date(),
    programId,
    courseId,
    semesterId,
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

  const roomIds = await seedRooms(org.id);
  console.log(`  rooms        : ${Object.keys(roomIds).length}`);

  const educatorIds = await seedEducators(org.id, emailExt, passwordHash);
  console.log(`  educators    : ${Object.keys(educatorIds).length}`);

  const subjectIds = await seedSubjects(ctx, levelIds);
  console.log(`  subjects     : ${Object.keys(subjectIds).length}`);

  const classRefs = await seedClasses(
    ctx,
    sections,
    subjectIds,
    educatorIds,
    roomIds,
  );
  console.log(`  classes      : ${classRefs.length}`);

  const { names, skipped } = dedupeNames(RAW_STUDENT_NAMES);
  const plans = buildPlans(names, classRefs, studentSectionDef.name);
  const targetSection = sections[studentSectionDef.name];
  const studentResult = await seedStudents(
    ctx,
    names,
    levelIds[studentSectionDef.levelName],
    targetSection.id,
    plans,
    classRefs.map((r) => r.classId),
    passwordHash,
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

  reportOverlaps();

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