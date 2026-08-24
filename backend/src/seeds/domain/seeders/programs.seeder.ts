import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { PROGRAMS } from '../../../modules/org-seeder/data/programs.data';
import {
  COLLEGE_COURSES,
  BSED_MAJORS,
} from '../../../modules/org-seeder/data/courses.data';
import { SHS_STRANDS } from '../../../modules/org-seeder/data/strands.data';

export async function seedPrograms(
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

export async function seedCourses(
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

export async function seedStrands(
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
