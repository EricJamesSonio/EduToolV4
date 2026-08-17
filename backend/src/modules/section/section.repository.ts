import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SectionRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    levelId: string;
    schoolYearId: string;
    courseId?: string;
    strandId?: string;
    name: string;
    capacity: number;
  }) {
    return this.db.section.create({
      data: {
        org_id: data.orgId,
        level_id: data.levelId,
        school_year_id: data.schoolYearId,
        course_id: data.courseId ?? null,
        strand_id: data.strandId ?? null,
        name: data.name,
        capacity: data.capacity,
      },
    });
  }

  async findAll(
    orgId: string,
    filters: {
      schoolYearId?: string;
      levelId?: string;
      programId?: string;
      courseId?: string;
      strandId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    let levelFilter: Record<string, unknown> = {};
    if (filters.levelId) {
      levelFilter = { level_id: filters.levelId };
    } else if (filters.programId) {
      const levels = await this.db.level.findMany({
        where: { program_id: filters.programId },
        select: { id: true },
      });
      levelFilter = { level_id: { in: levels.map((l) => l.id) } };
    }

    const where: Record<string, unknown> = {
      org_id: orgId,
      deleted_at: null,
      ...(filters.schoolYearId ? { school_year_id: filters.schoolYearId } : {}),
      ...levelFilter,
      ...(filters.courseId ? { course_id: filters.courseId } : {}),
      ...(filters.strandId ? { strand_id: filters.strandId } : {}),
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [sections, total] = await Promise.all([
      this.db.section.findMany({
        where,
        orderBy: [{ level_id: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.section.count({ where }),
    ]);

    const counts = await Promise.all(
      sections.map((s) => this.countStudentsInSection(s.id)),
    );

    return {
      data: sections.map((s, i) => ({ ...s, studentCount: counts[i] })),
      total,
    };
  }

  async findById(id: string, orgId: string) {
    return this.db.section.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
    });
  }

  async update(id: string, data: { name?: string; capacity?: number }) {
    return this.db.section.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.db.section.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async countStudentsInSection(sectionId: string): Promise<number> {
    return this.db.profile.count({
      where: {
        metadata: { path: ['sectionId'], equals: sectionId },
        account: { role: 'student', deleted_at: null, status: 'active' },
      },
    });
  }

  async hasStudents(sectionId: string): Promise<boolean> {
    const count = await this.countStudentsInSection(sectionId);
    return count > 0;
  }
}
