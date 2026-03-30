import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto'

@Injectable()
export class CourseRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreateCourseDto) {
    return this.db.course.create({
      data: {
        org_id: orgId,
        program_id: dto.programId,  // ← was dto.program_id
        name: dto.name,
        code: dto.code ?? null,
      },
    })
  }

async findAll(org_id: string, programId?: string) {  // ← renamed param
  return this.db.course.findMany({
    where: {
      org_id,
      ...(programId ? { program_id: programId } : {}),  // ← updated
    },
      include: {
        subjects: {
          where: { is_locked: false },
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, org_id: string) {
    return this.db.course.findFirst({
      where: { id, org_id },
      include: {
        subjects: {
          include: {
            prerequisites: {
              include: { prerequisite: true },
            },
          },
        },
      },
    })
  }

  async update(id: string, org_id: string, dto: UpdateCourseDto) {
    return this.db.course.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    })
  }

  async delete(id: string, org_id: string) {
    return this.db.course.delete({
      where: { id },
    })
  }

  async existsInOrg(id: string, org_id: string): Promise<boolean> {
    const record = await this.db.course.findFirst({
      where: { id, org_id },
      select: { id: true },
    })
    return !!record
  }


}

