import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class SubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

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

  /** Resolves names for sharing target rows (course/strand/level). */
  private async enrichSharings(sharings: any[]) {
    if (!sharings.length) return []

    const courseIds = [...new Set(sharings.map((s) => s.course_id).filter(Boolean))]
    const strandIds = [...new Set(sharings.map((s) => s.strand_id).filter(Boolean))]
    const levelIds  = [...new Set(sharings.map((s) => s.level_id).filter(Boolean))]

    const [courses, strands, levels] = await Promise.all([
      courseIds.length
        ? this.db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true } })
        : [],
      strandIds.length
        ? this.db.strand.findMany({ where: { id: { in: strandIds } }, select: { id: true, name: true } })
        : [],
      levelIds.length
        ? this.db.level.findMany({ where: { id: { in: levelIds } }, select: { id: true, name: true } })
        : [],
    ])

    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.name]))
    const strandMap = Object.fromEntries(strands.map((s) => [s.id, s.name]))
    const levelMap  = Object.fromEntries(levels.map((l)  => [l.id, l.name]))

    return sharings.map((s) => ({
      id:         s.id,
      orgId:      s.org_id,
      subjectId:  s.subject_id,
      courseId:   s.course_id ?? null,
      courseName: s.course_id ? (courseMap[s.course_id] ?? null) : null,
      strandId:   s.strand_id ?? null,
      strandName: s.strand_id ? (strandMap[s.strand_id] ?? null) : null,
      levelId:    s.level_id ?? null,
      levelName:  s.level_id  ? (levelMap[s.level_id]   ?? null) : null,
    }))
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(data: {
    orgId:        string
    name:         string
    subjectType?: string
    programId?:   string
    levelId?:     string
    educatorId?:  string
    courseId?:    string
    strandId?:    string
    yearLevel?:   string
    termLabel?:   string
  }) {


    const subject = await this.db.subject.create({
      data: {
        org_id:       data.orgId,
        name:         data.name,
        subject_type: data.subjectType ?? 'major',
        program_id:   data.programId  ?? null,
        level_id:     data.levelId!,          // ← required, caller must provide
        educator_id:  data.educatorId ?? null,
        course_id:    data.courseId   ?? null,
        strand_id:    data.strandId   ?? null,
        year_level:   data.yearLevel  ?? null,
        term_label:   data.termLabel  ?? null,
        is_locked:    false,
      },
    })

    const [enriched] = await this.enrichSubjects([subject])
    return { ...enriched, sharings: [] }
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
      subjectType?:  string
    },
  ) {
    let courseFilter: Record<string, unknown> = {}
    if (filters.scope === 'open') {
      courseFilter = { course_id: null }
    } else if (filters.scope === 'coupled') {
      courseFilter = { course_id: { not: null } }
    } else if (filters.courseId) {
      courseFilter = { OR: [{ course_id: null }, { course_id: filters.courseId }] }
    } else if (filters.strandId) {
      courseFilter = { OR: [{ strand_id: null }, { strand_id: filters.strandId }] }
    }

    // Level filter is null-safe — minor subjects may have no level_id
    let levelFilter: Record<string, unknown> = {}
    if (filters.levelId) {
      levelFilter = { level_id: filters.levelId }
    } else if (filters.schoolYearId) {
      const levels = await this.db.level.findMany({
        where:  { school_year_id: filters.schoolYearId },
        select: { id: true },
      })
      const levelIds = levels.map((l) => l.id)
      // Include subjects with matching level OR subjects with no level (some minors)
      levelFilter = {
        OR: [
          { level_id: { in: levelIds } },
          { level_id: null },
        ],
      }
    }

    const subjects = await this.db.subject.findMany({
      where: {
        org_id: orgId,
        ...levelFilter,
        ...(filters.subjectType ? { subject_type: filters.subjectType }                          : {}),
        ...(filters.educatorId  ? { educator_id:  filters.educatorId }                           : {}),
        ...(filters.yearLevel   ? { year_level:   filters.yearLevel }                            : {}),
        ...(filters.termLabel   ? { term_label:   filters.termLabel }                            : {}),
        ...(filters.search      ? { name: { contains: filters.search, mode: 'insensitive' } }   : {}),
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
        sharings: true, // raw rows — enriched below
      },
      orderBy: [{ year_level: 'asc' }, { term_label: 'asc' }, { name: 'asc' }],
    })

    const enriched = await this.enrichSubjects(subjects)

    // Enrich sharings for all subjects in one batch per type
    const allSharings = subjects.flatMap((s: any) => s.sharings ?? [])
    const enrichedSharings = await this.enrichSharings(allSharings)

    // Map enriched sharings back to their subject by subject_id
    const sharingsBySubject = enrichedSharings.reduce<Record<string, any[]>>((acc, sh) => {
      if (!acc[sh.subjectId]) acc[sh.subjectId] = []
      acc[sh.subjectId].push(sh)
      return acc
    }, {})

    return enriched.map((s: any) => ({
      ...s,
      sharings: sharingsBySubject[s.id] ?? [],
    }))
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
        sharings: true,
      },
    })

    if (!subject) return null

    const [enriched] = await this.enrichSubjects([subject])
    const enrichedSharings = await this.enrichSharings((subject as any).sharings ?? [])

    return { ...enriched, sharings: enrichedSharings }
  }

  async update(
    id: string,
    data: {
      name?:       string
      levelId?:    string | null
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
      ...(data.name      !== undefined ? { name:        data.name }              : {}),
      ...(data.levelId   !== undefined ? { level_id:    data.levelId! }          : {}),
      ...(data.educatorId !== undefined ? { educator_id: { set: data.educatorId } } : {}),
      ...(data.courseId  !== undefined ? { course_id:   { set: data.courseId } } : {}),
      ...(data.strandId  !== undefined ? { strand_id:   { set: data.strandId } } : {}),
      ...(data.yearLevel !== undefined ? { year_level:  { set: data.yearLevel } } : {}),
      ...(data.termLabel !== undefined ? { term_label:  { set: data.termLabel } } : {}),
    },
  })

    const [enriched] = await this.enrichSubjects([subject])
    return { ...enriched, sharings: [] }
  }

  async setLocked(id: string, isLocked: boolean) {
    const subject = await this.db.subject.update({
      where: { id },
      data:  { is_locked: isLocked },
    })
    const [enriched] = await this.enrichSubjects([subject])
    return { ...enriched, sharings: [] }
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

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  async addSharing(
    subjectId: string,
    orgId: string,
    target: { courseId?: string; strandId?: string; levelId?: string },
  ) {
    const sharing = await this.db.subjectSharing.create({
      data: {
        org_id:     orgId,
        subject_id: subjectId,
        course_id:  target.courseId ?? null,
        strand_id:  target.strandId ?? null,
        level_id:   target.levelId  ?? null,
      },
    })

    const [enriched] = await this.enrichSharings([sharing])
    return enriched
  }

  async removeSharing(sharingId: string, orgId: string) {
    return this.db.subjectSharing.deleteMany({
      where: { id: sharingId, org_id: orgId },
    })
  }

  async findSharings(subjectId: string, orgId: string) {
    const sharings = await this.db.subjectSharing.findMany({
      where: { subject_id: subjectId, org_id: orgId },
    })
    return this.enrichSharings(sharings)
  }
}