import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LevelRepository } from './level.repository';
import {
  UpdateLevelDefaultsDto,
  UpdateLevelDto,
  CreateLevelDto,
  BulkGenerateLevelsDto,
} from './dto/level.dto';
import { DatabaseService } from '@/core/database/database.provider';
import { getLevelLabel } from './level-label.util';

@Injectable()
export class LevelService {
  constructor(
    private readonly levelRepository: LevelRepository,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Get default levels (not scoped to school year)
   */
  async getDefaults(orgId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId, deleted_at: null },
      include: { program: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update default level names
   */
  async updateOne(id: string, orgId: string, dto: UpdateLevelDto) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');

    if (dto.count === undefined) return existing;

    const program = await this.db.program.findFirst({
      where: { id: existing.program_id, org_id: orgId },
    });
    if (!program) throw new NotFoundException('Program not found.');

    const name = getLevelLabel(program.type, dto.count);
    return this.levelRepository.update(id, { name });
  }

  /**
   * Get all levels for a school year
   */
  async getAll(orgId: string, schoolYearId?: string) {
    return this.levelRepository.findAll(orgId, schoolYearId);
  }

  /**
   * Get levels by school year and program (only program-scoped levels, not course/strand scoped)
   */
  async getBySchoolYear(orgId: string, schoolYearId: string) {
    return this.levelRepository.findBySchoolYear(orgId, schoolYearId);
  }

  /**
   * Get levels for a specific course (direct course_id lookup)
   */
  async getByCourse(orgId: string, schoolYearId: string, courseId: string) {
    return this.levelRepository.findByCourseAndSchoolYear(
      orgId,
      schoolYearId,
      courseId,
    );
  }

  /**
   * Get levels for a specific strand (direct strand_id lookup)
   */
  async getByStrand(orgId: string, schoolYearId: string, strandId: string) {
    return this.levelRepository.findByStrandAndSchoolYear(
      orgId,
      schoolYearId,
      strandId,
    );
  }

  /**
   * Get levels by program and school year (excluding course/strand scoped levels)
   */
  async getByProgram(orgId: string, programId: string, schoolYearId: string) {
    return this.levelRepository.findByProgramAndSchoolYear(
      orgId,
      programId,
      schoolYearId,
    );
  }

  /**
   * Seed levels from defaults
   */
  async seedFromDefaults(
    orgId: string,
    schoolYearId: string,
    programMap: Record<string, string>,
  ) {
    return this.levelRepository.seedFromDefaults(
      orgId,
      schoolYearId,
      programMap,
    );
  }

  /**
   * Update a level
   */
  async updateOne(id: string, orgId: string, dto: UpdateLevelDto) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    return this.levelRepository.update(id, { name: dto.name });
  }

  /**
   * Create a new level
   */
  /**
   * Parent guard: when a level is scoped to a course or strand, that parent
   * must exist in the org AND be live (not archived) — archived parents must
   * never gain new children (orphan/ghost-tree prevention).
   */
  private async assertLiveScopedParents(
    orgId: string,
    courseId?: string | null,
    strandId?: string | null,
  ): Promise<void> {
    if (courseId) {
      const course = await this.db.course.findFirst({
        where: { id: courseId, org_id: orgId, deleted_at: null },
        select: { id: true },
      });
      if (!course) throw new NotFoundException('Course not found.');
    }
    if (strandId) {
      const strand = await this.db.strand.findFirst({
        where: { id: strandId, org_id: orgId, deleted_at: null },
        select: { id: true },
      });
      if (!strand) throw new NotFoundException('Strand not found.');
    }
  }

  async createOne(orgId: string, dto: CreateLevelDto) {
    const program = await this.db.program.findFirst({
      where: { id: dto.programId, org_id: orgId },
    });
    if (!program) throw new NotFoundException('Program not found.');
    await this.assertLiveScopedParents(orgId, dto.courseId, dto.strandId);

    const name = getLevelLabel(program.type, dto.count);

    return this.levelRepository.create(orgId, {
      programId: dto.programId,
      schoolYearId: dto.schoolYearId,
      name,
      courseId: dto.courseId,
      strandId: dto.strandId,
    });
  }

  /**
   * Add next incremental level for a program
   */
  async addNextLevel(
    orgId: string,
    programId: string,
    schoolYearId: string,
    courseId?: string,
    strandId?: string,
  ) {
    const program = await this.db.program.findFirst({
      where: { id: programId, org_id: orgId },
    });
    if (!program) throw new NotFoundException('Program not found.');
    await this.assertLiveScopedParents(orgId, courseId, strandId);

    const existingCount = await this.db.level.count({
      where: {
        org_id: orgId,
        program_id: programId,
        school_year_id: schoolYearId,
        course_id: courseId ?? null,
        strand_id: strandId ?? null,
        deleted_at: null,
      },
    });

    const nextCount = existingCount + 1;
    const name = getLevelLabel(program.type, nextCount);

    return this.levelRepository.create(orgId, {
      programId,
      schoolYearId,
      name,
      courseId,
      strandId,
    });
  }

  /**
   * Delete a level: hard-delete when nothing references it, otherwise archive
   * the level together with its live sections. Subjects and subject sharings
   * count as data (they are never wiped), and already-archived sections are
   * cleaned up on the hard path so no FK blocks the delete.
   * Returns which happened so the caller/UI can report it.
   */
  async deleteOne(id: string, orgId: string): Promise<'deleted' | 'archived'> {
    const existing = await this.levelRepository.findByIdIncludingArchived(
      id,
      orgId,
    );
    if (!existing) throw new NotFoundException('Level not found.');
    if (existing.deleted_at) return 'archived';

    const [sectionIds, subjectIds] = await Promise.all([
      this.db.section.findMany({
        where: { org_id: orgId, level_id: id },
        select: { id: true },
      }),
      this.db.subject.findMany({
        where: { org_id: orgId, level_id: id },
        select: { id: true },
      }),
    ]);

    const sectionIdList = sectionIds.map((section) => section.id);
    const subjectIdList = subjectIds.map((subject) => subject.id);

    const classFilters = [
      ...(subjectIdList.length > 0
        ? [{ subject_id: { in: subjectIdList } }]
        : []),
      ...(sectionIdList.length > 0
        ? [{ section_id: { in: sectionIdList } }]
        : []),
    ];

    const [enrollmentCount, applicationCount, classCount, sharingCount] =
      await Promise.all([
        this.db.studentProgramEnrollment.count({
          where: {
            org_id: orgId,
            OR: [
              { level_id: id },
              ...(sectionIdList.length > 0
                ? [{ section_id: { in: sectionIdList } }]
                : []),
            ],
          },
        }),
        this.db.enrollmentApplication.count({
          where: {
            org_id: orgId,
            OR: [
              { level_id: id },
              ...(sectionIdList.length > 0
                ? [{ section_id: { in: sectionIdList } }]
                : []),
            ],
          },
        }),
        classFilters.length > 0
          ? this.db.class.count({
              where: {
                org_id: orgId,
                OR: classFilters,
              },
            })
          : Promise.resolve(0),
        this.db.subjectSharing.count({
          where: { org_id: orgId, level_id: id },
        }),
      ]);

    const hasData =
      subjectIdList.length > 0 ||
      enrollmentCount > 0 ||
      applicationCount > 0 ||
      classCount > 0 ||
      sharingCount > 0;

    if (hasData) {
      // Has data: archive the level and hide its live sections with it.
      const now = new Date();
      await this.db.$transaction([
        this.db.section.updateMany({
          where: { org_id: orgId, level_id: id, deleted_at: null },
          data: { deleted_at: now },
        }),
        this.db.level.update({ where: { id }, data: { deleted_at: now } }),
      ]);
      return 'archived';
    }

    // Nothing connected: remove the (possibly archived) sections, then the level.
    return this.db.$transaction(async (tx) => {
      await tx.section.deleteMany({
        where: { org_id: orgId, level_id: id },
      });

      await tx.level.delete({
        where: { id },
      });
      return 'deleted' as const;
    });
  }

  /**
   * Bulk generate levels for a program, optionally scoped to a course or strand
   */
  async bulkGenerate(orgId: string, dto: BulkGenerateLevelsDto) {
    const program = await this.db.program.findFirst({
      where: { id: dto.programId, org_id: orgId },
    });
    if (!program) throw new NotFoundException('Program not found.');
    await this.assertLiveScopedParents(orgId, dto.courseId, dto.strandId);

    const names = Array.from({ length: dto.count }, (_, i) =>
      getLevelLabel(program.type, i + 1),
    );

    await this.levelRepository.deleteByProgramAndSchoolYear(
      orgId,
      dto.programId,
      dto.schoolYearId,
      dto.courseId,
      dto.strandId,
    );
    return this.levelRepository.bulkCreate(
      names.map((name) => ({
        orgId,
        programId: dto.programId,
        schoolYearId: dto.schoolYearId,
        courseId: dto.courseId,
        strandId: dto.strandId,
        name,
      })),
    );
  }

  private generateLevelNames(type: string, count: number): string[] {
    switch (type) {
      case 'elementary':
        return Array.from({ length: count }, (_, i) => `Grade ${i + 1}`);
      case 'high_school':
        return Array.from({ length: count }, (_, i) => `Grade ${i + 7}`);
      case 'senior_high':
        return ['Grade 11', 'Grade 12'].slice(0, count);
      case 'college': {
        const ordinals = [
          '1st Year',
          '2nd Year',
          '3rd Year',
          '4th Year',
          '5th Year',
        ];
        return ordinals.slice(0, count);
      }
      default:
        return Array.from({ length: count }, (_, i) => `${i + 1}`);
    }
  }
}
