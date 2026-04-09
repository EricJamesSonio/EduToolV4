import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

const PROGRAM_LIST_INCLUDE = {
  courses: {
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' as const },
  },
  strands: {
    select: { id: true, name: true },
    orderBy: { name: 'asc' as const },
  },
}

const PROGRAM_DETAIL_INCLUDE = {
  courses: {
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true, name: true,
          year_level: true, term_label: true, is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
  strands: {
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true, name: true,
          year_level: true, term_label: true, is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
}

@Injectable()
export class ProgramRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: { orgId: string; schoolYearId: string; name: string; type: string }) {
    return this.db.program.create({
      data: {
        org_id:         data.orgId,
        school_year_id: data.schoolYearId,
        name:           data.name,
        type:           data.type,
      },
      include: PROGRAM_LIST_INCLUDE,
    })
  }

  async findAll(
    orgId: string,
    schoolYearId: string,
    includeAssignment = false,
  ) {
    return this.db.program.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
      },
      include: {
        ...PROGRAM_LIST_INCLUDE,

        // ✅ conditional include
        ...(includeAssignment && {
          semesterAssignment: {
            include: {
              template: {
                select: { id: true, name: true },
              },
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string, orgId: string) {
    return this.db.program.findFirst({
      where: { id, org_id: orgId },
      include: PROGRAM_DETAIL_INCLUDE,
    })
  }

  async findByNameAndYear(name: string, orgId: string, schoolYearId: string) {
    return this.db.program.findFirst({
      where: { name, org_id: orgId, school_year_id: schoolYearId },
      select: { id: true },
    })
  }

  async update(id: string, data: { name?: string; type?: string }) {
    return this.db.program.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
      },
      include: PROGRAM_LIST_INCLUDE,
    })
  }

  async delete(id: string) {
    return this.db.program.delete({ where: { id } })
  }

  async hasLevels(programId: string): Promise<boolean> {
    const count = await this.db.level.count({ where: { program_id: programId } })
    return count > 0
  }

  async hasCourses(programId: string): Promise<boolean> {
    const count = await this.db.course.count({ where: { program_id: programId } })
    return count > 0
  }

  async hasStrands(programId: string): Promise<boolean> {
    const count = await this.db.strand.count({ where: { program_id: programId } })
    return count > 0
  }
}