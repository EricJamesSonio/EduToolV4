import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SectionRepository } from './section.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateSectionDto, UpdateSectionDto, QuerySectionDto } from './dto/section.dto';

@Injectable()
export class SectionService {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(orgId: string, dto: CreateSectionDto) {
    const level = await this.db.level.findFirst({
      where: { id: dto.levelId, org_id: orgId },
    });
    if (!level) throw new NotFoundException('Level not found.');

    return this.sectionRepository.create({
      orgId,
      levelId: dto.levelId,
      name: dto.name,
      capacity: dto.capacity,
    });
  }

  async findAll(orgId: string, query: QuerySectionDto) {
    return this.sectionRepository.findAll(orgId, query.levelId);
  }

  async update(id: string, orgId: string, dto: UpdateSectionDto) {
    const section = await this.sectionRepository.findById(id, orgId);
    if (!section) throw new NotFoundException('Section not found.');

    return this.sectionRepository.update(id, {
      name: dto.name,
      capacity: dto.capacity,
    });
  }

  async remove(id: string, orgId: string) {
    const section = await this.sectionRepository.findById(id, orgId);
    if (!section) throw new NotFoundException('Section not found.');

    const inUse = await this.sectionRepository.hasStudents(id);
    if (inUse) {
      throw new ConflictException(
        'Cannot delete a section that has students assigned to it.',
      );
    }

    return this.sectionRepository.softDelete(id);
  }

  async findById(id: string, orgId: string) {
    const section = await this.sectionRepository.findById(id, orgId);
    if (!section) throw new NotFoundException('Section not found.');
    return section;
  }

  async countStudentsInSection(sectionId: string): Promise<number> {
    return this.sectionRepository.countStudentsInSection(sectionId);
  }
}