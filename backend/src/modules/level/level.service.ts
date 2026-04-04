import { Injectable, NotFoundException } from '@nestjs/common';
import { LevelRepository } from './level.repository';
import { UpdateLevelDefaultsDto, UpdateLevelDto, CreateLevelDto } from './dto/level.dto';
import { DatabaseService } from '@/core/database/database.provider';
import { BulkGenerateLevelsDto } from './dto/level.dto';

@Injectable()
export class LevelService {
  constructor(
  private readonly levelRepository: LevelRepository,
  private readonly db: DatabaseService,
) {}

  async getAll(orgId: string) {
    return this.levelRepository.findAll(orgId);
  }

  async getDefaults(orgId: string) {
    return this.levelRepository.findDefaultsByOrgId(orgId);
  }

  async updateDefaults(orgId: string, dto: UpdateLevelDefaultsDto) {
    return this.levelRepository.upsertDefaults(
      orgId,
      dto.levels.map((l) => ({ id: l.id, programId: l.programId, name: l.name })),
    );
  }

  async getBySchoolYear(orgId: string, schoolYearId: string) {
    return this.levelRepository.findBySchoolYear(orgId, schoolYearId);
  }

  async seedFromDefaults(orgId: string, schoolYearId: string) {
    return this.levelRepository.seedFromDefaults(orgId, schoolYearId);
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
    return this.levelRepository.delete(id); // ✅ ownership already verified above
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
        programId: dto.programId,
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