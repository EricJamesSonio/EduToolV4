// @/modules/section/section.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SectionRepository } from './section.repository';
import { CreateSectionDto, UpdateSectionDto, QuerySectionDto } from './dto/section.dto';

@Injectable()
export class SectionService {
  constructor(private readonly sectionRepository: SectionRepository) {}

  // ── POST /sections ──────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateSectionDto) {
    return this.sectionRepository.create({
      orgId,
      levelId: dto.levelId,
      name: dto.name,
      capacity: dto.capacity,
    });
  }

  // ── GET /sections ───────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QuerySectionDto) {
    return this.sectionRepository.findAll(orgId, query.levelId);
  }

  // ── PATCH /sections/:id ─────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateSectionDto) {
    const section = await this.sectionRepository.findById(id, orgId);

    if (!section) {
      throw new NotFoundException('Section not found.');
    }

    return this.sectionRepository.update(id, {
      name: dto.name,
      capacity: dto.capacity,
    });
  }

  // ── DELETE /sections/:id ────────────────────────────────────────────────────

  /**
   * Soft deletes the section.
   * Blocked if students are currently assigned to it.
   * Phase 3: hasStudents() will return real counts once student module is wired.
   */
  async remove(id: string, orgId: string) {
    const section = await this.sectionRepository.findById(id, orgId);

    if (!section) {
      throw new NotFoundException('Section not found.');
    }

    const inUse = await this.sectionRepository.hasStudents(id);

    if (inUse) {
      throw new ConflictException(
        'Cannot delete a section that has students assigned to it.',
      );
    }

    return this.sectionRepository.softDelete(id);
  }

  // ── Utility (called by other modules in Phase 3) ────────────────────────────

  async findById(id: string, orgId: string) {
    const section = await this.sectionRepository.findById(id, orgId);

    if (!section) {
      throw new NotFoundException('Section not found.');
    }

    return section;
  }

  async countStudentsInSection(sectionId: string): Promise<number> {
    return this.sectionRepository.countStudentsInSection(sectionId);
  }
}