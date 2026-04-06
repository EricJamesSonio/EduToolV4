import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class SubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  private async enrichSubjects(subjects: any[]) {
    if (!subjects.length) return subjects

    const levelIds    = [...new Set(subjects.map((s) => s.level_id).filter(Boolean))]
    const educatorIds = [...new Set(subjects.map((s) => s.educator_id).filter(Boolean))]

    const levels = levelIds.length
      ? await this.db.level.findMany({
          where:  { id: { in: levelIds } },
          select: { id: true, name: true },
        })
      : []

    const profiles = educatorIds.length
      ? await this.db.profile.findMany({
          where:  { account_id: { in: educatorIds } },
          select: { account_id: true, full_name: true },
        })
      : []

    const levelMap   = Object.fromEntries(levels.map((l) => [l.id, l.name]))
    const profileMap = Object.fromEntries(profiles.map((p) => [p.account_id, p.full_name]))

    return subjects.map((s) => ({
      ...s,
      levelName:    levelMap[s.level_id]      ?? null,
      educatorName: profileMap[s.educator_id] ?? null,
    }))
  }

  async create(data: {
    orgId:       string
    name:        string
    levelId:     string
    educatorId?: string
    courseId?:   string
    strandId?:   string
    yearLevel?:  string
    termLabel?:  string
  }) {
    const subject = await this.db.subject.create({
      data: {
        org_id:      data.orgId,
        name:        data.name,
        level_id:    data.levelId,
        educator_id: data.educatorId ?? null,
        course_id:   data.courseId   ?? null,
        strand_id:   data.strandId   ?? null,
        year_level:  data.yearLevel  ?? null,
        term_label:  data.termLabel  ?? null,
        is_locked:   false,
      },
    })
    const [enriched] = await this.enrichSubjects([subject])
    return enriched
  }

  async findAll(
    orgId: string,
    filters: {
      schoolYearId?: string
      levelId?:      string
      educatorId?:   string
      search?:       string
      courseId?:     string
      strandId?:     string
      scope?:        'open' | 'coupled'
      yearLevel?:    string
      termLabel?:    string
    },
  ) {
    let courseFilter: any = {}
    if (filters.scope === 'open') {
      courseFilter = { course_id: null }
    } else if (filters.scope === 'coupled') {
      courseFilter = { course_id: { not: null } }
    } else if (filters.courseId) {
      courseFilter = { OR: [{ course_id: null }, { course_id: filters.courseId }] }
    } else if (filters.strandId) {
      courseFilter = { OR: [{ strand_id: null }, { strand_id: filters.strandId }] }
    }

    // Subject has no @relation to Level — only a bare level_id FK.
    // When schoolYearId is provided (and no specific levelId), resolve the
    // matching level IDs first, then filter with level_id: { in: [...] }.
    let levelFilter: any = {}
    if (filters.levelId) {
      levelFilter = { level_id: filters.levelId }
    } else if (filters.schoolYearId) {
      const levels = await this.db.level.findMany({
        where:  { school_year_id: filters.schoolYearId },
        select: { id: true },
      })
      levelFilter = { level_id: { in: levels.map((l) => l.id) } }
    }

    const subjects = await this.db.subject.findMany({
      where: {
        org_id: orgId,
        ...levelFilter,
        ...(filters.educatorId ? { educator_id: filters.educatorId }                         : {}),
        ...(filters.yearLevel  ? { year_level:  filters.yearLevel }                          : {}),
        ...(filters.termLabel  ? { term_label:  filters.termLabel }                          : {}),
        ...(filters.search     ? { name: { contains: filters.search, mode: 'insensitive' } } : {}),
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

    return this.enrichSubjects(subjects)
  }

  async findById(id: string, orgId: string) {
    const subject = await this.db.subject.findFirst({
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
            subject: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!subject) return null
    const [enriched] = await this.enrichSubjects([subject])
    return enriched
  }

  async update(
    id: string,
    data: {
      name?:       string
      levelId?:    string
      educatorId?: string | null
      courseId?:   string | null
      strandId?:   string | null
      yearLevel?:  string | null
      termLabel?:  string | null
    },
  ) {
    const subject = await this.db.subject.update({
      where: { id },
      data: {
        ...(data.name       !== undefined ? { name:        data.name }       : {}),
        ...(data.levelId    !== undefined ? { level_id:    data.levelId }    : {}),
        ...(data.educatorId !== undefined ? { educator_id: data.educatorId } : {}),
        ...(data.courseId   !== undefined ? { course_id:   data.courseId }   : {}),
        ...(data.strandId   !== undefined ? { strand_id:   data.strandId }   : {}),
        ...(data.yearLevel  !== undefined ? { year_level:  data.yearLevel }  : {}),
        ...(data.termLabel  !== undefined ? { term_label:  data.termLabel }  : {}),
      },
    })
    const [enriched] = await this.enrichSubjects([subject])
    return enriched
  }

  async setLocked(id: string, isLocked: boolean) {
    const subject = await this.db.subject.update({
      where: { id },
      data:  { is_locked: isLocked },
    })
    const [enriched] = await this.enrichSubjects([subject])
    return enriched
  }

  async unlockAllForOrg(orgId: string) {
    return this.db.subject.updateMany({
      where: { org_id: orgId, is_locked: true },
      data:  { is_locked: false },
    })
  }

  async findByNameInOrg(name: string, orgId: string) {
    return this.db.subject.findFirst({
      where:  { name, org_id: orgId },
      select: { id: true, name: true },
    })
  }
}