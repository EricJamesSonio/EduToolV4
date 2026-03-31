import { Injectable, NotFoundException } from '@nestjs/common';
import { LevelRepository } from './level.repository';
import { UpdateLevelDefaultsDto, UpdateLevelDto, CreateLevelDto } from './dto/level.dto';

@Injectable()
export class LevelService {
  constructor(private readonly levelRepository: LevelRepository) {}

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
}