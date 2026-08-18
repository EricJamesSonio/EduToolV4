import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CourseRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreateCourseDto) {
    return this.db.course.create({
      data: {
        org_id: orgId,
        school_year_id: dto.schoolYearId,
        program_id: dto.programId,
        name: dto.name,
        code: dto.code ?? null,
      },
    });
  }

  async findAll(orgId: string, schoolYearId: string, programId?: string) {
    return this.db.course.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        ...(programId ? { program_id: programId } : {}),
      },
      include: {
        subjects: {
          where: { is_locked: false },
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, orgId: string) {
    return this.db.course.findFirst({
      where: { id, org_id: orgId },
      include: {
        subjects: {
          include: {
            prerequisites: { include: { prerequisite: true } },
          },
        },
      },
    });
  }

  async update(id: string, orgId: string, dto: UpdateCourseDto) {
    return this.db.course.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    });
  }

  async delete(id: string, _orgId: string) {
    return this.db.course.delete({ where: { id } });
  }

  async existsInOrg(id: string, orgId: string): Promise<boolean> {
    const record = await this.db.course.findFirst({
      where: { id, org_id: orgId },
      select: { id: true },
    });
    return !!record;
  }
}
