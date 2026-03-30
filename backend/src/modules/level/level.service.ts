// @/modules/level/level.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { LevelRepository } from './level.repository';
import { UpdateLevelDefaultsDto, UpdateLevelDto, CreateLevelDto } from './dto/level.dto';

@Injectable()
export class LevelService {
  constructor(private readonly levelRepository: LevelRepository) {}

  // ── GET /levels/defaults ──────────────────────────────────────────────────

  async getDefaults(orgId: string) {
    return this.levelRepository.findDefaultsByOrgId(orgId);
  }

  // ── PATCH /levels/defaults ────────────────────────────────────────────────

  /**
   * Admin sends the full desired default level list.
   * Existing rows (have an id) are updated; new rows (no id) are created.
   * Removal of defaults is intentionally not supported here — Admin deletes
   * individual levels via a separate flow if needed (Phase 3).
   */
  async updateDefaults(orgId: string, dto: UpdateLevelDefaultsDto) {
    return this.levelRepository.upsertDefaults(
      orgId,
      dto.levels.map((l) => ({
        id: l.id,
        programId: l.programId,
        name: l.name,
      })),
    );
  }

  // ── GET /levels?schoolYearId= ─────────────────────────────────────────────

  async getBySchoolYear(orgId: string, schoolYearId: string) {
    return this.levelRepository.findBySchoolYear(orgId, schoolYearId);
  }

  // ── Seed from defaults (called by school-year on creation) ────────────────

  async seedFromDefaults(orgId: string, schoolYearId: string) {
    return this.levelRepository.seedFromDefaults(orgId, schoolYearId);
  }

  // ── PATCH /levels/:id ─────────────────────────────────────────────────────

  async updateOne(id: string, orgId: string, dto: UpdateLevelDto) {
    const existing = await this.levelRepository.findById(id, orgId);

    if (!existing) {
      throw new NotFoundException('Level not found.');
    }

    return this.levelRepository.update(id, orgId, { name: dto.name });
  }

  async createOne(orgId: string, dto: CreateLevelDto) {
    return this.levelRepository.create(orgId, dto);
  }

  async deleteOne(id: string, orgId: string) {
    const existing = await this.levelRepository.findById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    return this.levelRepository.delete(id, orgId);
  }
}