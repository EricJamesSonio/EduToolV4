import { DatabaseService } from '@/core/database/database.provider';

/**
 * Subjects have no school_year_id: they belong to a year only through
 * level_id / program_id. Existence must be checked on that natural key (or
 * a year-scoped seed id), never on a year-less seed id, or a later school
 * year "finds" last year's subject and skips creating its own.
 */
export function findExistingSubject(
  db: DatabaseService,
  id: string,
  key: {
    orgId: string;
    subjectType: 'major' | 'minor';
    programId: string;
    name: string;
    levelId?: string;
    courseId?: string | null;
    strandId?: string | null;
  },
) {
  return db.subject.findFirst({
    where: {
      OR: [
        { id },
        {
          org_id: key.orgId,
          subject_type: key.subjectType,
          program_id: key.programId,
          name: key.name,
          ...(key.levelId !== undefined && { level_id: key.levelId }),
          ...(key.courseId !== undefined && { course_id: key.courseId }),
          ...(key.strandId !== undefined && { strand_id: key.strandId }),
        },
      ],
    },
  });
}