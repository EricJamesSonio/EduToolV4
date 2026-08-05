// backend/src/modules/program/program-type-resolver.ts
//
// Shared, dependency-light lookups that map a subject (or a class) to the
// program (and program type) it belongs to. Both ClassService and
// GradingSchemeTemplateService need these to scope grading templates without
// importing each other, which would create a circular dependency.
//
// NOTE: These functions take `db` explicitly (rather than living on a class)
// so they can be imported by any module service without introducing Nest-injected
// cycles.

import { DatabaseService } from '@/core/database/database.provider';

export async function resolveProgramIdFromSubject(
  db: DatabaseService,
  subjectId: string,
  orgId: string,
): Promise<string | null> {
  const subject = await db.subject.findFirst({
    where: { id: subjectId, org_id: orgId },
    select: {
      program_id: true,
      course_id:  true,
      strand_id:  true,
      level_id:   true,
    },
  })

  if (!subject) return null

  // Direct program link
  if (subject.program_id) return subject.program_id

  // Via course -> program
  if (subject.course_id) {
    const course = await db.course.findFirst({
      where: { id: subject.course_id, org_id: orgId },
      select: { program_id: true },
    })
    if (course?.program_id) return course.program_id
  }

  // Via strand -> program
  if (subject.strand_id) {
    const strand = await db.strand.findFirst({
      where: { id: subject.strand_id, org_id: orgId },
      select: { program_id: true },
    })
    if (strand?.program_id) return strand.program_id
  }

  // Via level -> program
  if (subject.level_id) {
    const level = await db.level.findFirst({
      where: { id: subject.level_id, org_id: orgId },
      select: { program_id: true },
    })
    if (level?.program_id) return level.program_id
  }

  // Via SubjectSharing
  const sharing = await db.subjectSharing.findFirst({
    where: { subject_id: subjectId, org_id: orgId },
    select: {
      course: { select: { program_id: true } },
      strand: { select: { program_id: true } },
      level:  { select: { program_id: true } },
    },
  })

  if (sharing?.course?.program_id) return sharing.course.program_id
  if (sharing?.strand?.program_id) return sharing.strand.program_id
  if (sharing?.level?.program_id)  return sharing.level.program_id

  return null
}

// Resolve the program type of a single class (used to validate template apply)
export async function getClassProgramType(
  db: DatabaseService,
  classId: string,
  orgId: string,
): Promise<string | null> {
  const cls = await db.class.findFirst({
    where: { id: classId, org_id: orgId, deleted_at: null },
    select: { subject_id: true },
  })

  if (!cls) return null

  const programId = await resolveProgramIdFromSubject(db, cls.subject_id, orgId)
  if (!programId) return null

  const program = await db.program.findFirst({
    where: { id: programId, org_id: orgId },
    select: { type: true },
  })

  return program?.type ?? null
}

// Resolve the set of program types an educator actually teaches
// (used to scope the grading-scheme template library)
export async function findEducatorProgramTypes(
  db: DatabaseService,
  educatorId: string,
  orgId: string,
): Promise<string[]> {
  const classes = await db.class.findMany({
    where: { educator_id: educatorId, org_id: orgId, deleted_at: null },
    select: { subject_id: true },
  })

  const subjectIds = [...new Set(classes.map((c) => c.subject_id))]
  if (subjectIds.length === 0) return []

  const subjects = await db.subject.findMany({
    where: { id: { in: subjectIds }, org_id: orgId },
    select: {
      program_id: true,
      course:     { select: { program_id: true } },
      strand:     { select: { program_id: true } },
      level:      { select: { program_id: true } },
      sharings: {
        select: {
          course: { select: { program_id: true } },
          strand: { select: { program_id: true } },
          level:  { select: { program_id: true } },
        },
      },
    },
  })

  const programIds = new Set<string>()
  for (const subject of subjects) {
    let programId =
      subject.program_id ??
      subject.course?.program_id ??
      subject.strand?.program_id ??
      subject.level?.program_id

    if (!programId) {
      for (const sharing of subject.sharings) {
        programId =
          sharing.course?.program_id ??
          sharing.strand?.program_id ??
          sharing.level?.program_id
        if (programId) break
      }
    }

    if (programId) programIds.add(programId)
  }

  if (programIds.size === 0) return []

  const programs = await db.program.findMany({
    where: { id: { in: [...programIds] }, org_id: orgId },
    select: { type: true },
  })

  return [...new Set(programs.map((p) => p.type).filter((t): t is string => !!t))]
}