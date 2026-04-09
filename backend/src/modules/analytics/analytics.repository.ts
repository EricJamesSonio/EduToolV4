import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeAnalyticsQueryDto } from './dto/analytics.dto';
import { SchoolYearEnrollmentStatus } from '@prisma/client'

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getActiveSchoolYear(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: 'active' },
      select: { id: true, name: true },
    })
  }

  async countStudents(orgId: string, schoolYearId: string) {
    return this.db.studentSchoolYear.count({
      where: { org_id: orgId, school_year_id: schoolYearId, status: 'active' },
    })
  }

async countStudentsByStatus(
  orgId: string,
  schoolYearId: string,
  status: SchoolYearEnrollmentStatus
) {
  return this.db.studentSchoolYear.count({
    where: {
      org_id: orgId,
      school_year_id: schoolYearId,
      status,
    },
  })
}

  async countEducators(orgId: string) {
    return this.db.account.count({
      where: { org_id: orgId, role: 'educator', status: 'active' },
    })
  }

  async countClasses(orgId: string, schoolYearId: string) {
    return this.db.class.count({
      where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
    })
  }

  async countUnlockedClasses(orgId: string, schoolYearId: string) {
    return this.db.gradeLock.count({
      where: {
        org_id:   orgId,
        is_locked: false,
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
    })
  }

  async countPendingStudents(orgId: string, schoolYearId: string) {
    return this.db.studentSchoolYear.count({
      where: { org_id: orgId, school_year_id: schoolYearId, status: 'pending' },
    })
  }

  async getEducatorLoad(orgId: string, schoolYearId: string) {
    const classes = await this.db.class.findMany({
      where:  { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
      select: {
        educator_id: true,
        enrollments: { select: { id: true } },
      },
    })

    const map: Record<string, { totalClasses: number; totalStudents: number }> = {}
    for (const cls of classes) {
      if (!map[cls.educator_id]) {
        map[cls.educator_id] = { totalClasses: 0, totalStudents: 0 }
      }
      map[cls.educator_id].totalClasses  += 1
      map[cls.educator_id].totalStudents += cls.enrollments.length
    }

    return Object.entries(map).map(([educatorId, data]) => ({ educatorId, ...data }))
  }

  async getLockedGrades(orgId: string, schoolYearId: string, query: GradeAnalyticsQueryDto) {
    return this.db.grade.findMany({
      where: {
        org_id:   orgId,
        is_locked: true,
        class: { school_year_id: schoolYearId, deleted_at: null },
        ...(query.classId && { class_id: query.classId }),
        ...(query.termId  && { term_id:  query.termId  }),
      },
      select: { final_score: true, final_grade: true },
    })
  }

  async getEnrollmentBreakdown(orgId: string, schoolYearId: string) {
    const sections = await this.db.section.findMany({
      where:   { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
      include: { level: { include: { program: true } } },
    })

    const classes = await this.db.class.findMany({
      where:  { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
      select: {
        section_id:  true,
        enrollments: { select: { status: true } },
      },
    })

    const sectionEnrollments = new Map<string, { active: number; pending: number }>()
    for (const cls of classes) {
      if (!cls.section_id) continue
      if (!sectionEnrollments.has(cls.section_id)) {
        sectionEnrollments.set(cls.section_id, { active: 0, pending: 0 })
      }
      const entry = sectionEnrollments.get(cls.section_id)!
      for (const e of cls.enrollments) {
        if (e.status === 'active')  entry.active  += 1
        if (e.status === 'pending') entry.pending += 1
      }
    }

    return sections.map((section) => {
      const counts = sectionEnrollments.get(section.id) ?? { active: 0, pending: 0 }
      return {
        levelSection: `${section.level.name} - ${section.name}`,
        programName:  section.level.program.name,
        gradeLevel:   section.level.name,
        sectionName:  section.name,
        activeCount:  counts.active,
        pendingCount: counts.pending,
        totalCount:   counts.active + counts.pending,
      }
    })
  }
}