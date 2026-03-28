import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class SubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string
    name: string
    levelId: string
    educatorId?: string
    courseId?: string
    strandId?: string
    yearLevel?: string
    termLabel?: string
  }) {
    return this.db.subject.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        level_id: data.levelId,
        educator_id: data.educatorId ?? null,
        course_id: data.courseId ?? null,
        strand_id: data.strandId ?? null,
        year_level: data.yearLevel ?? null,
        term_label: data.termLabel ?? null,
        is_locked: false,
      },
    })
  }

  async findAll(
    orgId: string,
    filters: {
      levelId?: string
      educatorId?: string
      search?: string
      courseId?: string
      strandId?: string
      scope?: 'open' | 'coupled'
      yearLevel?: string
      termLabel?: string
    },
  ) {
    // Build the course/strand scope filter
    // When courseId is provided: return open subjects (course_id = null)
    // + subjects coupled to that course — matches the seeding plan behaviour
    let courseFilter: any = {}

    if (filters.scope === 'open') {
      courseFilter = { course_id: null }
    } else if (filters.scope === 'coupled') {
      courseFilter = { course_id: { not: null } }
    } else if (filters.courseId) {
      courseFilter = {
        OR: [
          { course_id: null },
          { course_id: filters.courseId },
        ],
      }
    } else if (filters.strandId) {
      courseFilter = {
        OR: [
          { strand_id: null },
          { strand_id: filters.strandId },
        ],
      }
    }

    return this.db.subject.findMany({
      where: {
        org_id: orgId,
        ...(filters.levelId ? { level_id: filters.levelId } : {}),
        ...(filters.educatorId ? { educator_id: filters.educatorId } : {}),
        ...(filters.yearLevel ? { year_level: filters.yearLevel } : {}),
        ...(filters.termLabel ? { term_label: filters.termLabel } : {}),
        ...(filters.search
          ? { name: { contains: filters.search, mode: 'insensitive' } }
          : {}),
        ...courseFilter,
      },
      include: {
        prerequisites: {
          include: {
            prerequisite: {
              select: { id: true, name: true, year_level: true, term_label: true },
            },
          },
        },
      },
      orderBy: [{ year_level: 'asc' }, { term_label: 'asc' }, { name: 'asc' }],
    })
  }

  async findById(id: string, orgId: string) {
    return this.db.subject.findFirst({
      where: { id, org_id: orgId },
      include: {
        prerequisites: {
          include: {
            prerequisite: {
              select: { id: true, name: true, year_level: true, term_label: true },
            },
          },
        },
        prereqFor: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      levelId?: string
      educatorId?: string | null
      courseId?: string | null
      strandId?: string | null
      yearLevel?: string | null
      termLabel?: string | null
    },
  ) {
    return this.db.subject.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.levelId !== undefined ? { level_id: data.levelId } : {}),
        ...(data.educatorId !== undefined ? { educator_id: data.educatorId } : {}),
        ...(data.courseId !== undefined ? { course_id: data.courseId } : {}),
        ...(data.strandId !== undefined ? { strand_id: data.strandId } : {}),
        ...(data.yearLevel !== undefined ? { year_level: data.yearLevel } : {}),
        ...(data.termLabel !== undefined ? { term_label: data.termLabel } : {}),
      },
    })
  }

  async setLocked(id: string, isLocked: boolean) {
    return this.db.subject.update({
      where: { id },
      data: { is_locked: isLocked },
    })
  }

  async unlockAllForOrg(orgId: string) {
    return this.db.subject.updateMany({
      where: { org_id: orgId, is_locked: true },
      data: { is_locked: false },
    })
  }

  // Used by the seeder — find by name within the same org to resolve prerequisite IDs
  async findByNameInOrg(name: string, orgId: string) {
    return this.db.subject.findFirst({
      where: { name, org_id: orgId },
      select: { id: true, name: true },
    })
  }
}