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
    where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
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
      // Repair: existing student may have been seeded with section_id=null (previous bug where
      // level had sections but enrollment bypassed readiness). Ensure they now have a section.
      const ssyRepairId = seedId('ssy', orgId, existing.id, schoolYearId);
      const ssyRepair = await db.studentSchoolYear.findFirst({ where: { id: ssyRepairId } });
      if (ssyRepair) {
        const enrollment = await db.studentProgramEnrollment.findFirst({
          where: { student_school_year_id: ssyRepair.id, org_id: orgId },
        });
        if (enrollment && !enrollment.section_id && enrollment.level_id) {
          const lvl = enrollment.level_id;
          const sects = sectionsByProgram[enrollment.program_id ? (Object.entries(programMap).find(([,v])=>v===enrollment.program_id)?.[0] ?? '') : ''] ?? [];
          // Fallback: query DB directly for this level's sections (handles college course mismatch)
          let candidate: any = null;
          // Try direct lookup by level_id
          const direct = await db.section.findMany({
            where: { org_id: orgId, school_year_id: schoolYearId, level_id: lvl, deleted_at: null },
            take: 1,
          });
          if (direct.length > 0) candidate = direct[0];
          else {
            // Fallback: any section for that enrollment's program
            const progKey = Object.entries(programMap).find(([,v])=>v===enrollment.program_id)?.[0];
            if (progKey && sectionsByProgram[progKey]?.length) candidate = { id: sectionsByProgram[progKey][0].sectionId } as any;
          }
          if (candidate) {
            await db.studentProgramEnrollment.update({
              where: { id: enrollment.id },
              data: { section_id: candidate.id, status: 'active' },
            });
            await db.profile.updateMany({
              where: { account_id: existing.id },
              data: { metadata: { studentId: (existing as any).profile?.metadata?.studentId ?? undefined, levelId: lvl, sectionId: candidate.id } as any },
            }).catch(()=>{});
            console.log(`  ↻ Repaired student ${email} — assigned section ${candidate.id.slice(0,6)} for level ${lvl.slice(0,6)}`);
          }
        }
      }
      continue;
    }

    const studentId = generateStudentId();
    const levelKey = pick(allLevelKeys);
    const levelIds = levelsByProgram[levelKey] ?? [];
    const levelId = levelIds.length > 0 ? pick(levelIds) : null;

    // Find a section for this level — section is REQUIRED if the level has sections
    // (readiness guarantees every level has ≥1 section, so null would bypass validation).
    const [progKey] = levelKey.split(':');
    const programSections = sectionsByProgram[progKey] ?? [];
    let levelSections = programSections.filter((s) => s.levelId === levelId);
    // Fallback: if our in-memory map missed it (e.g. stale programMap), query DB directly
    if (levelSections.length === 0 && levelId) {
      const direct = await db.section.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, level_id: levelId, deleted_at: null },
        select: { id: true },
      });
      if (direct.length > 0) {
        levelSections = direct.map((d) => ({ sectionId: d.id, levelId, levelName: '' }));
        // also populate programSections cache for future picks
        for (const d of direct) programSections.push({ sectionId: d.id, levelId, levelName: '' });
      }
    }
    // If still empty, this level truly has 0 sections — this is a seed bug that would bypass
    // readiness (level should have sections). Create a fallback section so class & enrollment stay valid.
    let section: { sectionId: string; levelId: string; levelName: string } | null = null;
    if (levelSections.length > 0) {
      section = pick(levelSections);
    } else if (levelId) {
      console.warn(`  ⚠ Level ${levelId.slice(0,6)} has 0 sections for ${levelKey}; creating fallback Section A`);
      const fallbackId = seedId('section', progKey, levelKey + '|' + levelId, 'Section A', schoolYearId, orgId);
      const existingSec = await db.section.findFirst({ where: { id: fallbackId } });
      let secId = fallbackId;
      if (!existingSec) {
        const levelRec = await db.level.findUnique({ where: { id: levelId } });
        const created = await db.section.create({
          data: {
            id: fallbackId,
            org_id: orgId,
            level_id: levelId,
            school_year_id: schoolYearId,
            course_id: levelRec?.course_id ?? undefined,
            strand_id: levelRec?.strand_id ?? undefined,
            name: 'Section A',
            capacity: 40,
          },
        });
        secId = created.id;
        // add to cache
        programSections.push({ sectionId: secId, levelId, levelName: levelKey });
        sectionsByProgram[progKey] = programSections;
      }
      section = { sectionId: secId, levelId, levelName: levelKey };
    }

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

  // ── Final sweep: fix any remaining enrollments with null section (covers students
  // outside the 1..count range or that were skipped due to early continue) ──
  const remaining = await db.studentProgramEnrollment.findMany({
    where: { org_id: orgId, section_id: null, level_id: { not: null } },
    select: { id: true, level_id: true, program_id: true },
  });
  for (const enr of remaining) {
    if (!enr.level_id) continue;
    // Verify the enrollment belongs to the current school year via its SSY
    const ssy = await db.studentSchoolYear.findFirst({
      where: { id: (await db.studentProgramEnrollment.findUnique({ where: { id: enr.id }, select: { student_school_year_id: true } }))!.student_school_year_id, school_year_id: schoolYearId },
    });
    if (!ssy) continue;
    const secs = await db.section.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId, level_id: enr.level_id, deleted_at: null },
      select: { id: true },
    });
    let secId: string | null = null;
    if (secs.length > 0) secId = pick(secs).id;
    else {
      // Last resort: any section for that program
      const progKey = Object.entries(programMap).find(([, v]) => v === enr.program_id)?.[0];
      if (progKey) {
        const any = await db.section.findFirst({
          where: { org_id: orgId, school_year_id: schoolYearId, level: { program_id: enr.program_id }, deleted_at: null },
          select: { id: true },
        });
        if (any) secId = any.id;
      }
    }
    if (secId) {
      await db.studentProgramEnrollment.update({ where: { id: enr.id }, data: { section_id: secId } });
      console.log(`  ↻ Sweep repaired enrollment ${enr.id.slice(0,6)} — assigned section ${secId.slice(0,6)}`);
    }
  }

  return studentIds;
}
