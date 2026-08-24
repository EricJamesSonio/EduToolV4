import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import {
  allMajorSubjects,
  allMinorSubjects,
  deriveProgramKey,
} from '../../../modules/org-seeder/data/subjects';

export async function seedSubjects(
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
