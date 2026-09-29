import { Injectable } from '@nestjs/common';
import {
  ProgramEnrollmentStatus,
  SchoolYearEnrollmentStatus,
} from '@prisma/client';
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
        where: { program_id: filters.programId, deleted_at: null },
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

    const counts = await this.countStudentsInSections(
      orgId,
      sections.map((s) => s.id),
    );

    return {
      data: sections.map((s) => ({
        ...s,
        studentCount: counts.get(s.id) ?? 0,
      })),
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

  // Canonical section membership: an active StudentProgramEnrollment whose
  // parent StudentSchoolYear is not unenrolled and belongs to the section's
  // school year, on a live (non-soft-deleted) student account.
  // Legacy Profile.metadata.sectionId rows (written by the student create/update
  // flows and older seeders, and never cleared on section reassignment) are
  // unioned in, but only for students that also hold a StudentSchoolYear row in
  // the section's school year, so stale metadata cannot inflate a count.
  // orgId is always the authenticated tenant — never a request-supplied value.
  async countStudentsInSections(
    orgId: string,
    sectionIds: string[],
  ): Promise<Map<string, number>> {
    const ids = [...new Set(sectionIds.filter((id) => !!id))];
    const counts = new Map<string, number>(ids.map((id) => [id, 0]));
    if (ids.length === 0) return counts;

    const sections = await this.db.section.findMany({
      where: { id: { in: ids }, org_id: orgId, deleted_at: null },
      select: { id: true, school_year_id: true },
    });
    if (sections.length === 0) return counts;

    const sectionSy = new Map(
      sections.map((s) => [s.id, s.school_year_id]),
    );
    const schoolYearIds = [...new Set(sections.map((s) => s.school_year_id))];

    const [enrollments, legacyProfiles] = await Promise.all([
      this.db.studentProgramEnrollment.findMany({
        where: {
          org_id: orgId,
          section_id: { in: ids },
          status: ProgramEnrollmentStatus.active,
          studentSchoolYear: {
            org_id: orgId,
            school_year_id: { in: schoolYearIds },
            status: { not: SchoolYearEnrollmentStatus.unenrolled },
          },
        },
        select: {
          section_id: true,
          studentSchoolYear: { select: { student_id: true } },
        },
      }),
      this.db.profile.findMany({
        where: {
          OR: ids.map((id) => ({
            metadata: { path: ['sectionId'], equals: id },
          })),
          account: { org_id: orgId, role: 'student', deleted_at: null },
        },
        select: { account_id: true, metadata: true },
      }),
    ]);

    const candidates = new Map<string, Set<string>>(
      sections.map((s) => [s.id, new Set<string>()]),
    );

    for (const row of enrollments) {
      if (!row.section_id) continue;
      candidates.get(row.section_id)?.add(row.studentSchoolYear.student_id);
    }

    // Legacy rows carry no school-year link; keep only the ones whose student
    // is enrolled in the section's school year (small set, targeted lookup).
    if (legacyProfiles.length > 0) {
      const legacyStudentIds = [
        ...new Set(legacyProfiles.map((p) => p.account_id)),
      ];
      const legacySchoolYears = await this.db.studentSchoolYear.findMany({
        where: {
          org_id: orgId,
          student_id: { in: legacyStudentIds },
          school_year_id: { in: schoolYearIds },
          status: { not: SchoolYearEnrollmentStatus.unenrolled },
        },
        select: { student_id: true, school_year_id: true },
      });
      const enrolledIn = new Set(
        legacySchoolYears.map((r) => `${r.student_id}|${r.school_year_id}`),
      );

      for (const profile of legacyProfiles) {
        const meta = profile.metadata as { sectionId?: unknown } | null;
        const sectionId =
          typeof meta?.sectionId === 'string' ? meta.sectionId : null;
        if (!sectionId) continue;
        const schoolYearId = sectionSy.get(sectionId);
        if (!schoolYearId) continue;
        if (!enrolledIn.has(`${profile.account_id}|${schoolYearId}`)) continue;
        candidates.get(sectionId)?.add(profile.account_id);
      }
    }

    const candidateIds = [
      ...new Set([...candidates.values()].flatMap((set) => [...set])),
    ];
    if (candidateIds.length === 0) return counts;

    const liveStudents = await this.db.account.findMany({
      where: {
        id: { in: candidateIds },
        org_id: orgId,
        role: 'student',
        deleted_at: null,
      },
      select: { id: true },
    });
    const liveIds = new Set(liveStudents.map((a) => a.id));

    for (const [sectionId, set] of candidates) {
      let count = 0;
      for (const studentId of set) {
        if (liveIds.has(studentId)) count += 1;
      }
      counts.set(sectionId, count);
    }

    return counts;
  }

  async countStudentsInSection(
    orgId: string,
    sectionId: string,
  ): Promise<number> {
    const counts = await this.countStudentsInSections(orgId, [sectionId]);
    return counts.get(sectionId) ?? 0;
  }

  async hasStudents(orgId: string, sectionId: string): Promise<boolean> {
    const count = await this.countStudentsInSection(orgId, sectionId);
    return count > 0;
  }
}
