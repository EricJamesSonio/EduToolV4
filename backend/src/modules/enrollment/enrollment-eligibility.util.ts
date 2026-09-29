// backend/src/modules/enrollment/enrollment-eligibility.util.ts
//
// Shared, dependency-light helpers that determine whether a student's academic
// structure (program / course / strand / level) matches the structure a class
// prescribes through its subject. Used by both ClassService (class enrollment)
// and StudentService (manual enrollment from the student detail page) so the
// strict eligibility rule is enforced everywhere in exactly one place.

import { DatabaseService } from '@/core/database/database.provider';
import { resolveProgramIdFromSubject } from '../program/program-type-resolver';

export interface SubjectAcademicStructure {
  programId: string | null;
  courseIds: string[];
  strandIds: string[];
  levelIds: string[];
}

export interface StudentAcademicStructure {
  programId: string | null;
  levelId: string | null;
  courseId: string | null;
  strandId: string | null;
  sectionId: string | null;
}

/**
 * Resolves the academic structure a class inherits from its subject:
 * the program, plus the set of allowed courses/strands/levels (the subject's
 * own binding plus any SubjectSharing rows it is shared across).
 */
export async function resolveSubjectAcademicStructure(
  db: DatabaseService,
  subjectId: string,
  orgId: string,
): Promise<SubjectAcademicStructure> {
  const subject = await db.subject.findFirst({
    where: { id: subjectId, org_id: orgId },
    select: {
      course_id: true,
      strand_id: true,
      level_id: true,
      sharings: {
        select: { course_id: true, strand_id: true, level_id: true },
      },
    },
  });

  const courseIds = new Set<string>();
  const strandIds = new Set<string>();
  const levelIds = new Set<string>();

  for (const id of [subject?.course_id]) {
    if (id) courseIds.add(id);
  }
  for (const id of [subject?.strand_id]) {
    if (id) strandIds.add(id);
  }
  for (const id of [subject?.level_id]) {
    if (id) levelIds.add(id);
  }

  for (const sharing of subject?.sharings ?? []) {
    if (sharing.course_id) courseIds.add(sharing.course_id);
    if (sharing.strand_id) strandIds.add(sharing.strand_id);
    if (sharing.level_id) levelIds.add(sharing.level_id);
  }

  const programId = await resolveProgramIdFromSubject(db, subjectId, orgId);

  return {
    programId,
    courseIds: [...courseIds],
    strandIds: [...strandIds],
    levelIds: [...levelIds],
  };
}

/**
 * Batched variant of resolveSubjectAcademicStructure (Perf Phase 5): resolves
 * structures for many subjects with ONE subject query instead of N × (subject
 * + up-to-5 program-chain lookups). Program precedence per subject is
 * identical to the single-subject path (direct → course → strand → level →
 * first sharing that yields one). Subjects missing from the result (deleted
 * or out-of-org) map to an empty structure with programId null — the same
 * outcome as the single path, which callers treat as ineligible.
 */
export async function resolveSubjectAcademicStructures(
  db: DatabaseService,
  subjectIds: string[],
  orgId: string,
): Promise<Map<string, SubjectAcademicStructure>> {
  const uniqueIds = [...new Set(subjectIds)];
  const result = new Map<string, SubjectAcademicStructure>();
  if (uniqueIds.length === 0) return result;

  const subjects = await db.subject.findMany({
    where: { id: { in: uniqueIds }, org_id: orgId },
    select: {
      id: true,
      program_id: true,
      course_id: true,
      strand_id: true,
      level_id: true,
      course: { select: { program_id: true } },
      strand: { select: { program_id: true } },
      level: { select: { program_id: true } },
      sharings: {
        select: {
          course_id: true,
          strand_id: true,
          level_id: true,
          course: { select: { program_id: true } },
          strand: { select: { program_id: true } },
          level: { select: { program_id: true } },
        },
      },
    },
  });

  for (const subject of subjects) {
    let programId =
      subject.program_id ??
      subject.course?.program_id ??
      subject.strand?.program_id ??
      subject.level?.program_id ??
      null;
    if (!programId) {
      for (const sharing of subject.sharings) {
        programId =
          sharing.course?.program_id ??
          sharing.strand?.program_id ??
          sharing.level?.program_id ??
          null;
        if (programId) break;
      }
    }

    const courseIds = new Set<string>();
    const strandIds = new Set<string>();
    const levelIds = new Set<string>();
    if (subject.course_id) courseIds.add(subject.course_id);
    if (subject.strand_id) strandIds.add(subject.strand_id);
    if (subject.level_id) levelIds.add(subject.level_id);
    for (const sharing of subject.sharings) {
      if (sharing.course_id) courseIds.add(sharing.course_id);
      if (sharing.strand_id) strandIds.add(sharing.strand_id);
      if (sharing.level_id) levelIds.add(sharing.level_id);
    }

    result.set(subject.id, {
      programId,
      courseIds: [...courseIds],
      strandIds: [...strandIds],
      levelIds: [...levelIds],
    });
  }

  return result;
}

/**
 * Returns true only if the student matches ALL applicable structure fields of
 * the class:
 *   - Same program (always required)
 *   - Same course or strand (only when the class requires one)
 *   - Same level (only when the class requires one)
 *   - Same section (only when the class is assigned to a section)
 *
 * Students with incomplete academic data (no active program enrollment) are
 * always treated as not eligible.
 */
export function isEligibleForClassStructure(
  subject: SubjectAcademicStructure,
  student: StudentAcademicStructure | null,
  classSectionId?: string | null,
): boolean {
  if (!student) return false;
  if (!subject.programId || !student.programId) return false;
  if (student.programId !== subject.programId) return false;

  if (classSectionId && student.sectionId !== classSectionId) return false;

  const courseRequired = subject.courseIds.length > 0;
  const strandRequired = subject.strandIds.length > 0;
  const levelRequired = subject.levelIds.length > 0;

  if (
    courseRequired &&
    (!student.courseId || !subject.courseIds.includes(student.courseId))
  ) {
    return false;
  }
  if (
    strandRequired &&
    (!student.strandId || !subject.strandIds.includes(student.strandId))
  ) {
    return false;
  }
  if (
    levelRequired &&
    (!student.levelId || !subject.levelIds.includes(student.levelId))
  ) {
    return false;
  }

  return true;
}
