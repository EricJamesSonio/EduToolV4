// filepath: src/modules/subject/subject.repository.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  // needed by service to determine program type for validation
  async findProgramById(programId: string, orgId: string) {
    return this.db.program.findFirst({
      where:  { id: programId, org_id: orgId },
      select: { id: true, type: true },
    });
  }

  private async enrichSubjects(subjects: any[]) {
    if (!subjects.length) return subjects;

    const levelIds = [...new Set(subjects.map((s) => s.level_id).filter(Boolean))];

    const levels = levelIds.length
      ? await this.db.level.findMany({
          where:  { id: { in: levelIds } },
          select: { id: true, name: true },
        })
      : [];

    const levelMap = Object.fromEntries(levels.map((l) => [l.id, l.name]));

    return subjects.map((s) => ({
      ...s,
      levelName: levelMap[s.level_id] ?? null,
    }));
  }

  private async enrichSharings(sharings: any[]) {
    if (!sharings.length) return [];

    const courseIds = [...new Set(sharings.map((s) => s.course_id).filter(Boolean))];
    const strandIds = [...new Set(sharings.map((s) => s.strand_id).filter(Boolean))];
    const levelIds  = [...new Set(sharings.map((s) => s.level_id).filter(Boolean))];

    const [courses, strands, levels] = await Promise.all([
      courseIds.length ? this.db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true } }) : [],
      strandIds.length ? this.db.strand.findMany({ where: { id: { in: strandIds } }, select: { id: true, name: true } }) : [],
      levelIds.length  ? this.db.level.findMany({  where: { id: { in: levelIds } },  select: { id: true, name: true } }) : [],
    ]);

    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.name]));
    const strandMap = Object.fromEntries(strands.map((s) => [s.id, s.name]));
    const levelMap  = Object.fromEntries(levels.map((l)  => [l.id, l.name]));

    return sharings.map((s) => ({
      id:         s.id,
      orgId:      s.org_id,
      subjectId:  s.subject_id,
      courseId:   s.course_id ?? null,
      courseName: s.course_id ? (courseMap[s.course_id] ?? null) : null,
      strandId:   s.strand_id ?? null,
      strandName: s.strand_id ? (strandMap[s.strand_id] ?? null) : null,
      levelId:    s.level_id  ?? null,
      levelName:  s.level_id  ? (levelMap[s.level_id]   ?? null) : null,
    }));
  }

  async create(data: {
    orgId:        string;
    name:         string;
    subjectType?: string;
    programId?:   string;
    levelId?:     string;
    courseId?:    string;
    strandId?:    string;
    yearLevel?:   string;
    termLabel?:   string;
  }) {
    const subject = await this.db.subject.create({
      data: {
        org_id:       data.orgId,
        name:         data.name,
        subject_type: data.subjectType ?? 'major',
        program_id:   data.programId   ?? null,
        level_id:     data.levelId     ?? null,
        educator_id:  null,              // educator assignment removed — handled by class
        course_id:    data.courseId    ?? null,
        strand_id:    data.strandId    ?? null,
        year_level:   data.yearLevel   ?? null,
        term_label:   data.termLabel   ?? null,
        is_locked:    false,
      },
    });
    const [enriched] = await this.enrichSubjects([subject]);
    return { ...enriched, sharings: [] };
  }

// filepath: backend/src/modules/subject/subject.repository.ts

async findAll(
  orgId: string,
  filters: {
    schoolYearId?: string;
    programId?: string;
    levelId?: string;
    search?: string;
    courseId?: string;
    strandId?: string;
    scope?: 'open' | 'coupled';
    yearLevel?: string;
    termLabel?: string;
    subjectType?: string;
  },
) {
  let courseFilter: Record<string, unknown> = {};
  if (filters.scope === 'open') {
    courseFilter = { course_id: null };
  } else if (filters.scope === 'coupled') {
    courseFilter = { course_id: { not: null } };
  } else if (filters.courseId) {
    courseFilter = { OR: [{ course_id: null }, { course_id: filters.courseId }] };
  } else if (filters.strandId) {
    courseFilter = { OR: [{ strand_id: null }, { strand_id: filters.strandId }] };
  }

  let levelFilter: Record<string, unknown> = {};
  if (filters.levelId) {
    levelFilter = { level_id: filters.levelId };
  } else if (filters.schoolYearId) {
    const levels = await this.db.level.findMany({
      where:  { school_year_id: filters.schoolYearId },
      select: { id: true },
    });
    const levelIds = levels.map((l) => l.id);
    levelFilter = { OR: [{ level_id: { in: levelIds } }, { level_id: null }] };
  }

  // ── THE FIX ──────────────────────────────────────────────────────────────
  // When no specific programId is selected ("All programs"), scope subjects
  // to only the programs that belong to the selected school year.
  // Without this, the level_id: null branch returns subjects from ALL years.
  let programFilter: Record<string, unknown> = {};
  if (filters.programId) {
    programFilter = { program_id: filters.programId };
  } else if (filters.schoolYearId) {
    const programs = await this.db.program.findMany({
      where:  { school_year_id: filters.schoolYearId, org_id: orgId },
      select: { id: true },
    });
    const programIds = programs.map((p) => p.id);
    programFilter = { program_id: { in: programIds } };
  }
  // ─────────────────────────────────────────────────────────────────────────

  const baseWhere = {
    org_id: orgId,
    ...levelFilter,
    ...programFilter,           // ← replaces the old inline programId check
    ...(filters.subjectType ? { subject_type: filters.subjectType } : {}),
    ...(filters.yearLevel   ? { year_level:   filters.yearLevel }   : {}),
    ...(filters.termLabel   ? { term_label:   filters.termLabel }   : {}),
    ...(filters.search      ? { name: { contains: filters.search, mode: 'insensitive' as const } } : {}),
    ...courseFilter,
  };

  const subjectInclude = {
    program: {
      select: { name: true, type: true },
    },
    prerequisites: {
      include: {
        prerequisite: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
    },
    sharings: true,
  };

  const subjects = await this.db.subject.findMany({
    where:   baseWhere,
    include: subjectInclude,
    orderBy: [{ year_level: 'asc' }, { term_label: 'asc' }, { name: 'asc' }],
  });

  // Shared minor subjects visible to the selected level
  let sharedMinorSubjects: any[] = [];
  if (filters.levelId) {
    sharedMinorSubjects = await this.db.subject.findMany({
      where: {
        org_id:       orgId,
        subject_type: 'minor',
        sharings:     { some: { level_id: filters.levelId } },
      },
      include: subjectInclude,
      orderBy: [{ year_level: 'asc' }, { term_label: 'asc' }, { name: 'asc' }],
    });
  }

  const allSubjects = [
    ...subjects,
    ...sharedMinorSubjects.filter(
      (shared) => !subjects.some((s) => s.id === shared.id),
    ),
  ];

  const enriched        = await this.enrichSubjects(allSubjects);
  const allSharings     = allSubjects.flatMap((s: any) => s.sharings ?? []);
  const enrichedSharings = await this.enrichSharings(allSharings);

  const sharingsBySubject = enrichedSharings.reduce<Record<string, any[]>>(
    (acc, sh) => {
      if (!acc[sh.subjectId]) acc[sh.subjectId] = [];
      acc[sh.subjectId].push(sh);
      return acc;
    },
    {},
  );

  return enriched.map((s: any) => ({
    ...s,
    sharings: sharingsBySubject[s.id] ?? [],
  }));
}

  async findById(id: string, orgId: string) {
    const subject = await this.db.subject.findFirst({
      where: { id, org_id: orgId },
      include: {
        program: { select: { id: true, type: true } },  // ← ADD
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, name: true, year_level: true, term_label: true } },
          },
        },
        prereqFor: {
          include: { subject: { select: { id: true, name: true } } },
        },
        sharings: true,
      },
    })
    if (!subject) return null
    const [enriched]      = await this.enrichSubjects([subject])
    const enrichedSharings = await this.enrichSharings((subject as any).sharings ?? [])
    return { ...enriched, sharings: enrichedSharings }
  }

  async update(
    id: string,
    data: {
      name?:      string;
      levelId?:   string | null;
      courseId?:  string | null;
      strandId?:  string | null;
      yearLevel?: string | null;
      termLabel?: string | null;
    },
  ) {
    const subject = await this.db.subject.update({
      where: { id },
      data: {
        ...(data.name      !== undefined ? { name:       data.name }               : {}),
        ...(data.levelId   !== undefined ? { level_id:   { set: data.levelId } }   : {}),
        ...(data.courseId  !== undefined ? { course_id:  { set: data.courseId } }  : {}),
        ...(data.strandId  !== undefined ? { strand_id:  { set: data.strandId } }  : {}),
        ...(data.yearLevel !== undefined ? { year_level: { set: data.yearLevel } } : {}),
        ...(data.termLabel !== undefined ? { term_label: { set: data.termLabel } } : {}),
      },
    });
    const [enriched] = await this.enrichSubjects([subject]);
    return { ...enriched, sharings: [] };
  }

  async setLocked(id: string, isLocked: boolean) {
    const subject = await this.db.subject.update({
      where: { id },
      data:  { is_locked: isLocked },
    });
    const [enriched] = await this.enrichSubjects([subject]);
    return { ...enriched, sharings: [] };
  }

  async unlockAllForOrg(orgId: string) {
    return this.db.subject.updateMany({
      where: { org_id: orgId, is_locked: true },
      data:  { is_locked: false },
    });
  }

  async findByNameInOrg(name: string, orgId: string) {
    return this.db.subject.findFirst({
      where:  { name, org_id: orgId },
      select: { id: true, name: true },
    });
  }

  async addSharing(
    subjectId: string,
    orgId:     string,
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
    });
    const [enriched] = await this.enrichSharings([sharing]);
    return enriched;
  }

  async removeSharing(sharingId: string, orgId: string) {
    return this.db.subjectSharing.deleteMany({
      where: { id: sharingId, org_id: orgId },
    });
  }

  async findSharings(subjectId: string, orgId: string) {
    const sharings = await this.db.subjectSharing.findMany({
      where: { subject_id: subjectId, org_id: orgId },
    });
    return this.enrichSharings(sharings);
  }

  async findCourseById(courseId: string, orgId: string) {
    return this.db.course.findFirst({
      where: { id: courseId, org_id: orgId },
      select: { id: true, program_id: true },
    })
  }

  async findStrandById(strandId: string, orgId: string) {
    return this.db.strand.findFirst({
      where: { id: strandId, org_id: orgId },
      select: { id: true, program_id: true },
    })
  }

  async findLevelById(levelId: string, orgId: string) {
    return this.db.level.findFirst({
      where: { id: levelId, org_id: orgId },
      select: { id: true, program_id: true },
    })
  }
}