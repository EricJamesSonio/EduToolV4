import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CourseRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreateCourseDto) {
    return this.db.course.create({
      data: {
        org_id: orgId,
        school_year_id: dto.schoolYearId,
        program_id: dto.programId,
        name: dto.name,
        code: dto.code ?? null,
      },
    });
  }

  async findAll(orgId: string, schoolYearId: string, programId?: string) {
    return this.db.course.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        deleted_at: null,
        ...(programId ? { program_id: programId } : {}),
      },
      include: {
        subjects: {
          where: { is_locked: false },
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, orgId: string) {
    return this.db.course.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
        subjects: {
          include: {
            prerequisites: { include: { prerequisite: true } },
          },
        },
      },
    });
  }

  async update(id: string, orgId: string, dto: UpdateCourseDto) {
    return this.db.course.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    });
  }

  /**
   * Delete: hard-delete when nothing references the course, otherwise soft
   * delete (archive) the course together with its levels and sections so no
   * orphan or half-hidden rows remain. Returns which happened.
   */
  async remove(id: string, orgId: string): Promise<'deleted' | 'archived'> {
    return this.db.$transaction(async (tx) => {
      const levelIds = (
        await tx.level.findMany({
          where: { org_id: orgId, course_id: id },
          select: { id: true },
        })
      ).map((l) => l.id);

      // Sections scoped to this course directly OR living under its levels.
      const sectionWhere = {
        org_id: orgId,
        OR: [{ course_id: id }, { level_id: { in: levelIds } }],
      };
      const sectionIds = (
        await tx.section.findMany({ where: sectionWhere, select: { id: true } })
      ).map((s) => s.id);

      // Subjects scoped to this course directly OR to one of its levels.
      const subjectScope = {
        OR: [{ course_id: id }, { level_id: { in: levelIds } }],
      };

      const [enrollments, applications, classes, subjects, sharings] =
        await Promise.all([
          tx.studentProgramEnrollment.count({
            where: {
              org_id: orgId,
              OR: [
                { course_id: id },
                { level_id: { in: levelIds } },
                { section_id: { in: sectionIds } },
              ],
            },
          }),
          tx.enrollmentApplication.count({
            where: {
              org_id: orgId,
              OR: [
                { course_id: id },
                { level_id: { in: levelIds } },
                { section_id: { in: sectionIds } },
              ],
            },
          }),
          // Counts every class row (archived included) — an archived class
          // still holds an FK to its subject/section, so it blocks a hard delete.
          tx.class.count({
            where: {
              org_id: orgId,
              OR: [
                { subject: { ...subjectScope } },
                { section_id: { in: sectionIds } },
              ],
            },
          }),
          tx.subject.count({ where: { org_id: orgId, ...subjectScope } }),
          tx.subjectSharing.count({ where: { org_id: orgId, ...subjectScope } }),
        ]);

      const hasData = enrollments + applications + classes + subjects + sharings > 0;

      if (!hasData) {
        // Nothing connected: remove children first, then the course itself.
        await tx.section.deleteMany({ where: sectionWhere });
        await tx.level.deleteMany({ where: { org_id: orgId, course_id: id } });
        await tx.course.delete({ where: { id } });
        return 'deleted' as const;
      }

      // Has data: archive the course and hide its levels and sections with it.
      const now = new Date();
      await tx.section.updateMany({
        where: { ...sectionWhere, deleted_at: null },
        data: { deleted_at: now },
      });
      await tx.level.updateMany({
        where: { org_id: orgId, course_id: id, deleted_at: null },
        data: { deleted_at: now },
      });
      await tx.course.update({ where: { id }, data: { deleted_at: now } });
      return 'archived' as const;
    });
  }

  /** Existence check that ignores the archive flag (for remove() idempotency). */
  async findByIdIncludingArchived(id: string, orgId: string) {
    return this.db.course.findFirst({
      where: { id, org_id: orgId },
      select: { id: true, deleted_at: true },
    });
  }

  /** Parent guard for create: the program must exist in the same org. */
  async programExistsInOrg(programId: string, orgId: string): Promise<boolean> {
    const program = await this.db.program.findFirst({
      where: { id: programId, org_id: orgId },
      select: { id: true },
    });
    return !!program;
  }

  async existsInOrg(id: string, orgId: string): Promise<boolean> {
    const record = await this.db.course.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      select: { id: true },
    });
    return !!record;
  }
}
