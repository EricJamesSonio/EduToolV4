import {
  BadRequestException,
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
      where: { org_id: orgId },
      include: { program: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update default level names
   */
  async updateDefaults(orgId: string, dto: UpdateLevelDefaultsDto) {
    const toUpdate = dto.levels.filter((l) => !!l.id);
    return this.db.$transaction(
      toUpdate.map((l) =>
        this.db.level.update({
          where: { id: l.id },
          data: { name: l.name },
        }),
      ),
    );
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
  async createOne(orgId: string, dto: CreateLevelDto) {
    return this.levelRepository.create(orgId, {
      programId: dto.programId,
      schoolYearId: dto.schoolYearId,
      name: dto.name,
      courseId: dto.courseId,
      strandId: dto.strandId,
    });
  }

  /**
   * Add next incremental level for a program
   */
  async addNextLevel(orgId: string, programId: string, schoolYearId: string) {
    // Verify program exists and belongs to organization
    const program = await this.db.program.findFirst({
      where: { id: programId, org_id: orgId },
    });
    if (!program) throw new NotFoundException('Program not found.');

    // Get existing levels for this program to determine next number
    const existingLevels =
      await this.levelRepository.findByProgramAndSchoolYear(
        orgId,
        programId,
        schoolYearId,
      );

    // Extract level numbers from existing level names
    const levelNumbers = existingLevels
      .map((level) => {
        // Try to extract number from patterns like "ProgramName Level X", "Grade X", "Xst Year", etc.
        const match = level.name.match(
          /(?:Level|Grade|(\d+)(?:st|nd|rd|th)? Year)?\s*(\d+)$/,
        );
        if (match) {
          return parseInt(match[match.length - 1], 10);
        }
        // If no pattern matches, try to extract any number from the name
        const numberMatch = level.name.match(/\d+/);
        return numberMatch ? parseInt(numberMatch[0], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextLevelNumber =
      levelNumbers.length > 0 ? Math.max(...levelNumbers) + 1 : 1;

    // Generate level name
    const levelName = `${program.name} Level ${nextLevelNumber}`;

    return this.levelRepository.create(orgId, {
      programId,
      schoolYearId,
      name: levelName,
    });
  }

  /**
   * Delete a level
   */
  async deleteOne(id: string, orgId: string) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');

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

    const [enrollmentCount, classCount] = await Promise.all([
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
      classFilters.length > 0
        ? this.db.class.count({
            where: {
              org_id: orgId,
              OR: classFilters,
            },
          })
        : Promise.resolve(0),
    ]);

    if (enrollmentCount > 0 || classCount > 0) {
      throw new BadRequestException(
        'Cannot remove this level because it is already used by enrollments or classes.',
      );
    }

    return this.db.$transaction(async (tx) => {
      if (subjectIdList.length > 0) {
        await tx.subjectPrerequisite.deleteMany({
          where: {
            OR: [
              { subject_id: { in: subjectIdList } },
              { prerequisite_id: { in: subjectIdList } },
            ],
          },
        });
        await tx.subjectSharing.deleteMany({
          where: {
            OR: [{ subject_id: { in: subjectIdList } }, { level_id: id }],
          },
        });
        await tx.subject.deleteMany({
          where: { org_id: orgId, level_id: id },
        });
      } else {
        await tx.subjectSharing.deleteMany({
          where: { org_id: orgId, level_id: id },
        });
      }

      await tx.section.deleteMany({
        where: { org_id: orgId, level_id: id },
      });

      return tx.level.delete({
        where: { id },
      });
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

    const names = this.generateLevelNames(program.type, dto.count);
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
