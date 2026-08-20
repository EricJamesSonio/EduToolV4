import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AccountStatus } from '@prisma/client';
import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { SALT_ROUNDS, SEED_PASSWORD } from '../constants';
import { pick } from '../utils/random.util';
import { buildStudentEmail, generateStudentId } from '../utils/identity.util';

export async function seedStudents(
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
