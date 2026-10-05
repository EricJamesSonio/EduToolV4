import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';

/** Any client with the model delegates — `DatabaseService` or a tx client. */
export type ProgramDeletionClient = Prisma.TransactionClient;

const PROGRAM_LIST_INCLUDE = {
  courses: {
    select: { id: true, name: true, code: true },
    where: { deleted_at: null },
    orderBy: { name: 'asc' as const },
  },
  strands: {
    select: { id: true, name: true },
    where: { deleted_at: null },
    orderBy: { name: 'asc' as const },
  },
};

const PROGRAM_DETAIL_INCLUDE = {
  courses: {
    where: { deleted_at: null },
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true,
          name: true,
          year_level: true,
          term_label: true,
          is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
  strands: {
    where: { deleted_at: null },
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true,
          name: true,
          year_level: true,
          term_label: true,
          is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
};

@Injectable()
export class ProgramRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    schoolYearId: string;
    name: string;
    type: string;
  }) {
    return this.db.program.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        name: data.name,
        type: data.type,
      },
      include: PROGRAM_LIST_INCLUDE,
    });
  }

  async findAll(
    orgId: string,
    schoolYearId: string,
    includeAssignment = false,
  ) {
    return this.db.program.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
      },
      include: {
        ...PROGRAM_LIST_INCLUDE,

        // ✅ conditional include
        ...(includeAssignment && {
          semesterAssignment: {
            include: {
              template: {
                select: { id: true, name: true },
              },
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllWithStats(orgId: string, schoolYearId: string) {
    const programs = await this.db.program.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
      },
      select: {
        id: true,
        org_id: true,
        school_year_id: true,
        name: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch related data based on program type
    const programIds = programs.map((p) => p.id);

    const [levels, courses, strands] = await Promise.all([
      this.db.level.findMany({
        where: { program_id: { in: programIds }, deleted_at: null },
        select: { id: true, name: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
      this.db.course.findMany({
        where: { program_id: { in: programIds }, deleted_at: null },
        select: { id: true, name: true, code: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
      this.db.strand.findMany({
        where: { program_id: { in: programIds }, deleted_at: null },
        select: { id: true, name: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Group related data by program_id
    const levelsByProgram = levels.reduce(
      (acc, level) => {
        if (!acc[level.program_id]) acc[level.program_id] = [];
        acc[level.program_id].push(level);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const coursesByProgram = courses.reduce(
      (acc, course) => {
        if (!acc[course.program_id]) acc[course.program_id] = [];
        acc[course.program_id].push(course);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const strandsByProgram = strands.reduce(
      (acc, strand) => {
        if (!acc[strand.program_id]) acc[strand.program_id] = [];
        acc[strand.program_id].push(strand);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Combine programs with their stats
    return programs.map((program) => ({
      ...program,
      levels: levelsByProgram[program.id] || [],
      courses: coursesByProgram[program.id] || [],
      strands: strandsByProgram[program.id] || [],
    }));
  }

    async countLevelsAndSections(programId: string) {
    const levels = await this.db.level.findMany({
      where: { program_id: programId, deleted_at: null },
      select: { id: true, course_id: true, strand_id: true },
    });
    if (levels.length === 0) return [];

    const grouped = await this.db.section.groupBy({
      by: ['level_id'],
      where: { level_id: { in: levels.map((l) => l.id) }, deleted_at: null },
      _count: { _all: true },
    });
    const perLevel = new Map(grouped.map((g) => [g.level_id, g._count._all]));

    return levels.map((l) => ({
      ...l,
      sectionCount: perLevel.get(l.id) ?? 0,
    }));
  }

  async findById(id: string, orgId: string) {
    return this.db.program.findFirst({
      where: { id, org_id: orgId },
      include: PROGRAM_DETAIL_INCLUDE,
    });
  }

  async findByNameAndYear(name: string, orgId: string, schoolYearId: string) {
    return this.db.program.findFirst({
      where: { name, org_id: orgId, school_year_id: schoolYearId },
      select: { id: true },
    });
  }

  async update(id: string, data: { name?: string; type?: string }) {
    return this.db.program.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
      },
      include: PROGRAM_LIST_INCLUDE,
    });
  }

  async delete(id: string) {
    return this.db.program.delete({ where: { id } });
  }

  // ── Safe delete: repository counts what's linked, the service decides ──
  // NOTE: class counts deliberately include soft-deleted rows — an archived
  // class still holds the Subject FK, so ignoring it would hit a DB-level
  // FK restrict error on subject delete.

  async getOwnedSubjectIds(
    client: ProgramDeletionClient,
    programId: string,
  ): Promise<string[]> {
    const rows = await client.subject.findMany({
      where: { program_id: programId },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async getBlockerCounts(
    client: ProgramDeletionClient,
    orgId: string,
    programId: string,
  ) {
    const [subjectIds, levelIds, courseIds, strandIds, semesterIds] =
      await Promise.all([
        this.getOwnedSubjectIds(client, programId),
        client.level
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.course
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.strand
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.semester
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
      ]);

    const [enrollments, applications, classes, overrides, sharedSubjects] =
      await Promise.all([
        client.studentProgramEnrollment.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.enrollmentApplication.count({
          where: { org_id: orgId, program_id: programId },
        }),
        subjectIds.length === 0 && semesterIds.length === 0
          ? 0
          : client.class.count({
              where: {
                org_id: orgId,
                OR: [
                  ...(subjectIds.length > 0
                    ? [{ subject_id: { in: subjectIds } }]
                    : []),
                  ...(semesterIds.length > 0
                    ? [{ semester_id: { in: semesterIds } }]
                    : []),
                ],
              },
            }),
        subjectIds.length === 0
          ? 0
          : client.subjectCompletionOverride.count({
              where: { org_id: orgId, subject_id: { in: subjectIds } },
            }),
        // Foreign subjects pointing at this program's structure (sharing rows
        // are cleaned in the cascade, but a hard subject FK from another
        // department must fail loudly instead of being silently re-homed).
        client.subject.count({
          where: {
            org_id: orgId,
            program_id: { not: programId },
            OR: [
              ...(levelIds.length > 0
                ? [{ level_id: { in: levelIds } }]
                : []),
              ...(courseIds.length > 0
                ? [{ course_id: { in: courseIds } }]
                : []),
              ...(strandIds.length > 0
                ? [{ strand_id: { in: strandIds } }]
                : []),
            ],
          },
        }),
      ]);

    return { enrollments, applications, classes, overrides, sharedSubjects };
  }

  async getCascadeCounts(
    client: ProgramDeletionClient,
    orgId: string,
    programId: string,
  ) {
    const [subjects, levels, courses, strands, semesters, sections] =
      await Promise.all([
        client.subject.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.level.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.course.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.strand.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.semester.count({
          where: { org_id: orgId, program_id: programId },
        }),
        client.section.count({
          where: {
            org_id: orgId,
            level: { org_id: orgId, program_id: programId },
          },
        }),
      ]);

    return { subjects, levels, courses, strands, semesters, sections };
  }

  /**
   * Hard-delete a department and everything it owns, children before parents.
   * Callers must run the blocker check first (the service re-runs it inside
   * the same transaction to close the race). `ProgramCalendar` rows and
   * grading-scheme program assignments cascade at DB level and are not
   * deleted explicitly.
   */
  async deleteCascade(
    client: ProgramDeletionClient,
    orgId: string,
    programId: string,
  ): Promise<void> {
    const [subjectIds, levelIds, courseIds, strandIds, semesterIds] =
      await Promise.all([
        this.getOwnedSubjectIds(client, programId),
        client.level
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.course
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.strand
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
        client.semester
          .findMany({
            where: { org_id: orgId, program_id: programId },
            select: { id: true },
          })
          .then((rows) => rows.map((row) => row.id)),
      ]);

    // 1. Sections (hold Level/Course/Strand FKs, onDelete Restrict).
    if (levelIds.length > 0) {
      await client.section.deleteMany({
        where: { org_id: orgId, level_id: { in: levelIds } },
      });
    }

    if (subjectIds.length > 0) {
      // 2. Subject sharings — both directions: rows for our subjects AND rows
      // pointing at our courses/strands/levels from foreign subjects.
      const sharingOr: Prisma.SubjectSharingWhereInput[] = [
        { subject_id: { in: subjectIds } },
      ];
      if (courseIds.length > 0) sharingOr.push({ course_id: { in: courseIds } });
      if (strandIds.length > 0) sharingOr.push({ strand_id: { in: strandIds } });
      if (levelIds.length > 0) sharingOr.push({ level_id: { in: levelIds } });
      await client.subjectSharing.deleteMany({
        where: { org_id: orgId, OR: sharingOr },
      });

      // 3. Prerequisites, both directions.
      await client.subjectPrerequisite.deleteMany({
        where: {
          org_id: orgId,
          OR: [
            { subject_id: { in: subjectIds } },
            { prerequisite_id: { in: subjectIds } },
          ],
        },
      });

      // 4. Educator-subject links (onDelete Restrict on the subject side).
      await client.educatorSubject.deleteMany({
        where: { org_id: orgId, subject_id: { in: subjectIds } },
      });

      // 5. Completion overrides for our subjects (cleanup, not a blocker).
      await client.subjectCompletionOverride.deleteMany({
        where: { org_id: orgId, subject_id: { in: subjectIds } },
      });

      // 6. Owned subjects (foreign-owned shared subjects are blockers, never
      // deleted here).
      await client.subject.deleteMany({
        where: { org_id: orgId, program_id: programId },
      });
    } else {
      // No owned subjects, but foreign sharings may still point at our
      // courses/strands/levels — those rows would block their deletes.
      const sharingOr: Prisma.SubjectSharingWhereInput[] = [];
      if (courseIds.length > 0) sharingOr.push({ course_id: { in: courseIds } });
      if (strandIds.length > 0) sharingOr.push({ strand_id: { in: strandIds } });
      if (levelIds.length > 0) sharingOr.push({ level_id: { in: levelIds } });
      if (sharingOr.length > 0) {
        await client.subjectSharing.deleteMany({
          where: { org_id: orgId, OR: sharingOr },
        });
      }
    }

    // 7. Levels (hold Course/Strand Restrict FKs) — after sections + subjects.
    await client.level.deleteMany({
      where: { org_id: orgId, program_id: programId },
    });

    // 8-9. Courses, then strands.
    await client.course.deleteMany({
      where: { org_id: orgId, program_id: programId },
    });
    await client.strand.deleteMany({
      where: { org_id: orgId, program_id: programId },
    });

    // 10. Terms, then semesters.
    if (semesterIds.length > 0) {
      await client.term.deleteMany({
        where: { org_id: orgId, semester_id: { in: semesterIds } },
      });
    }
    await client.semester.deleteMany({
      where: { org_id: orgId, program_id: programId },
    });

    // 11. Program-semester term dates, then the assignment.
    const assignment = await client.programSemesterAssignment.findFirst({
      where: { org_id: orgId, program_id: programId },
      select: { id: true },
    });
    if (assignment) {
      await client.programSemesterTermDate.deleteMany({
        where: { org_id: orgId, assignment_id: assignment.id },
      });
      await client.programSemesterAssignment.delete({
        where: { id: assignment.id },
      });
    }

    // 12. Grading-scale assignment (no DB cascade on the program side).
    await client.gradingScaleAssignment.deleteMany({
      where: { org_id: orgId, program_id: programId },
    });

    // 13. The program itself. Program calendars + grading-scheme program
    // assignments cascade at DB level.
    await client.program.delete({ where: { id: programId } });
  }

}
