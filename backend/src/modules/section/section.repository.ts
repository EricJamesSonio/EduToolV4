import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SectionRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId:        string;
    levelId:      string;
    schoolYearId: string;
    name:         string;
    capacity:     number;
  }) {
    return this.db.section.create({
      data: {
        org_id:         data.orgId,
        level_id:       data.levelId,
        school_year_id: data.schoolYearId,
        name:           data.name,
        capacity:       data.capacity,
      },
    });
  }

  async findAll(orgId: string, schoolYearId?: string, levelId?: string) {
    const sections = await this.db.section.findMany({
      where: {
        org_id:     orgId,
        deleted_at: null,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
        ...(levelId      ? { level_id: levelId }            : {}),
      },
      orderBy: [{ level_id: 'asc' }, { name: 'asc' }],
    });

    const counts = await Promise.all(
      sections.map((s) => this.countStudentsInSection(s.id)),
    );

    return sections.map((s, i) => ({ ...s, studentCount: counts[i] }));
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
      data:  { deleted_at: new Date() },
    });
  }

  async countStudentsInSection(sectionId: string): Promise<number> {
    return this.db.profile.count({
      where: {
        metadata: { path: ['sectionId'], equals: sectionId },
        account:  { role: 'student', deleted_at: null, status: 'active' },
      },
    });
  }

  async hasStudents(sectionId: string): Promise<boolean> {
    const count = await this.countStudentsInSection(sectionId);
    return count > 0;
  }
}