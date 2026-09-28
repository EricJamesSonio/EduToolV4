import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SectionRepository } from './section.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  QuerySectionDto,
} from './dto/section.dto';

@Injectable()
export class SectionService {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private letterForIndex(i: number): string {
    let n = i;
    let s = '';
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }

  async create(orgId: string, dto: CreateSectionDto, actorId: string) {
    const level = await this.db.level.findFirst({
      where: { id: dto.levelId, org_id: orgId },
    });
    if (!level) throw new NotFoundException('Level not found.');

    if (dto.courseId) {
      const course = await this.db.course.findFirst({
        where: { id: dto.courseId, org_id: orgId },
      });
      if (!course) throw new NotFoundException('Course not found.');
    }

    if (dto.strandId) {
      const strand = await this.db.strand.findFirst({
        where: { id: dto.strandId, org_id: orgId },
      });
      if (!strand) throw new NotFoundException('Strand not found.');
    }

    // Name is always auto-derived — the next unused letter in this exact
    // level/course/strand/school-year scope. Ignores any name the client sent.
    const existingCount = await this.db.section.count({
      where: {
        org_id: orgId,
        level_id: dto.levelId,
        school_year_id: dto.schoolYearId,
        course_id: dto.courseId ?? null,
        strand_id: dto.strandId ?? null,
        deleted_at: null,
      },
    });
    const name = this.letterForIndex(existingCount);

    const section = await this.sectionRepository.create({
      orgId,
      levelId: dto.levelId,
      schoolYearId: dto.schoolYearId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      name,
      capacity: dto.capacity,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'section_created',
        entityType: 'section',
        entityId: section.id,
        metadata: { name, capacity: dto.capacity },
      })
      .catch(() => {});

    return section;
  }
  // update/remove/findAll/findById/countStudentsInSection unchanged

  async findAll(orgId: string, query: QuerySectionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.sectionRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      levelId: query.levelId,
      programId: query.programId,
      courseId: query.courseId,
      strandId: query.strandId,
      search: query.search,
      page,
      limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateSectionDto,
    actorId: string,
  ) {
    const section = await this.sectionRepository.findById(id, orgId);
    if (!section) throw new NotFoundException('Section not found.');

    if (dto.capacity !== undefined) {
      const enrolledCount =
        await this.sectionRepository.countStudentsInSection(id);
      if (dto.capacity < enrolledCount) {
        throw new ConflictException(
          `Cannot set capacity to ${dto.capacity} — this section currently has ${enrolledCount} enrolled student(s). Lower the enrollment first, or set capacity to at least ${enrolledCount}.`,
        );
      }
    }

    // Check for duplicate section name (case-insensitive, scoped to level + school year + course/strand)
    // Exclude the current section from the check
    const nameToCheck = dto.name ?? section.name;
    const existingSection = await this.db.section.findFirst({
      where: {
        org_id: orgId,
        name: {
          equals: nameToCheck,
          mode: 'insensitive' as const,
        },
        ...(dto.levelId ? { level_id: dto.levelId } : section.level_id ? { level_id: section.level_id } : {}),
        ...(dto.schoolYearId ? { school_year_id: dto.schoolYearId } : section.school_year_id ? { school_year_id: section.school_year_id } : {}),
        ...(dto.courseId ? { course_id: dto.courseId } : section.course_id ? { course_id: section.course_id } : {}),
        ...(dto.strandId ? { strand_id: dto.strandId } : section.strand_id ? { strand_id: section.strand_id } : {}),
      },
    });
    if (existingSection && existingSection.id !== id) {
      throw new ConflictException(
        `Section name already exists in this program and level.`,
      );
    }

    const updated = await this.sectionRepository.update(id, {
      name: dto.name,
      capacity: dto.capacity,
    });

    // Keep every live class of this section in step with its new capacity.
    if (dto.capacity !== undefined) {
      await this.db.class.updateMany({
        where: { org_id: orgId, section_id: id, deleted_at: null },
        data: { capacity: dto.capacity },
      });
    }

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'section_updated',
        entityType: 'section',
        entityId: id,
        metadata: { name: dto.name },
      })
      .catch(() => {});

    return updated;
  }

  async remove(id: string, orgId: string, actorId: string) {
    const section = await this.sectionRepository.findById(id, orgId);
    if (!section) throw new NotFoundException('Section not found.');

    const inUse = await this.sectionRepository.hasStudents(id);
    if (inUse) {
      throw new ConflictException(
        'Cannot delete a section that has students assigned to it.',
      );
    }
    await this.sectionRepository.softDelete(id);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'section_deleted',
        entityType: 'section',
        entityId: id,
        metadata: { name: section.name },
      })
      .catch(() => {});
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
