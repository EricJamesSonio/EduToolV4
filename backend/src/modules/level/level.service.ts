import { Injectable, NotFoundException } from '@nestjs/common';
import { LevelRepository } from './level.repository';
import { UpdateLevelDefaultsDto, UpdateLevelDto, CreateLevelDto, BulkGenerateLevelsDto } from './dto/level.dto';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class LevelService {
  constructor(
    private readonly levelRepository: LevelRepository,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Returns all levels for the org, grouped by program.
   * Used by the frontend as the org's "default level template".
   */
  async getDefaults(orgId: string) {
    return this.db.level.findMany({
      where:   { org_id: orgId },
      include: { program: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Bulk-upserts level rows for the org from UpdateLevelDefaultsDto.
   *   - dto.levels[n].id present  → update name only
   *   - dto.levels[n].id absent   → skip (school_year_id required by schema;
   *     add schoolYearId to LevelItemDto and CreateLevelDto path if creates needed here)
   */
  async updateDefaults(orgId: string, dto: UpdateLevelDefaultsDto) {
    const toUpdate = dto.levels.filter((l) => !!l.id);

    return this.db.$transaction(
      toUpdate.map((l) =>
        this.db.level.update({
          where: { id: l.id },
          data:  { name: l.name },
        }),
      ),
    );
  }

  async getAll(orgId: string, schoolYearId?: string) {
    return this.levelRepository.findAll(orgId, schoolYearId);
  }

  async getBySchoolYear(orgId: string, schoolYearId: string) {
    return this.levelRepository.findBySchoolYear(orgId, schoolYearId);
  }

  async seedFromDefaults(
    orgId: string,
    schoolYearId: string,
    programMap: Record<string, string>,
  ) {
    return this.levelRepository.seedFromDefaults(orgId, schoolYearId, programMap);
  }

  async updateOne(id: string, orgId: string, dto: UpdateLevelDto) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    return this.levelRepository.update(id, { name: dto.name });
  }

  async createOne(orgId: string, dto: CreateLevelDto) {
    return this.levelRepository.create(orgId, dto);
  }

  async deleteOne(id: string, orgId: string) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    return this.levelRepository.delete(id);
  }

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
    );
    return this.levelRepository.bulkCreate(
      names.map((name) => ({
        orgId,
        programId:    dto.programId,
        schoolYearId: dto.schoolYearId,
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
        const ordinals = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
        return ordinals.slice(0, count);
      }
      default:
        return Array.from({ length: count }, (_, i) => `${i + 1}`);
    }
  }
}