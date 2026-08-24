import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { resolveSubjectAcademicStructure } from '../enrollment/enrollment-eligibility.util';

@Injectable()
export class ClassRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    subjectId: string;
    educatorId: string;
    sectionId?: string;
    schoolYearId: string;
    semesterId: string;
    capacity: number;
  }) {
    return this.db.class.create({
      data: {
        org_id: data.orgId,
        subject_id: data.subjectId,
        educator_id: data.educatorId,
        section_id: data.sectionId ?? null,
        school_year_id: data.schoolYearId,
        semester_id: data.semesterId,
        capacity: data.capacity,
      },
      include: {
        schedules: true,
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
      },
    });
  }

  async findAll(
    orgId: string,
    filters: {
      schoolYearId?: string;
      semesterId?: string;
      educatorId?: string;
      subjectId?: string;
      sectionId?: string;
      programId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 20 } = filters;

    const where: any = {
      org_id: orgId,
      deleted_at: null,
      ...(filters.schoolYearId && { school_year_id: filters.schoolYearId }),
      ...(filters.semesterId && { semester_id: filters.semesterId }),
      ...(filters.educatorId && { educator_id: filters.educatorId }),
      ...(filters.subjectId && { subject_id: filters.subjectId }),
      ...(filters.sectionId && { section_id: filters.sectionId }),
      ...(filters.programId && {
        subject: {
          OR: [
            { program_id: filters.programId },
            { course: { program_id: filters.programId } },
            { strand: { program_id: filters.programId } },
          ],
        },
      }),
      ...(filters.search && {
        OR: [
          { subject: { name: { contains: filters.search, mode: 'insensitive' } } },
          {
            educator: {
              profile: { full_name: { contains: filters.search, mode: 'insensitive' } },
            },
          },
        ],
      }),
    };

    const include = {
      _count: {
        select: { enrollments: true },
      },
      schedules: true,
      gradingSchemes: {
        where: { template_id: { not: null } },
        orderBy: { created_at: 'desc' as const },
        take: 1,
        select: { template_id: true },
      },
      subject: {
        select: {
          id: true,
          name: true,
          program_id: true,
          course_id: true,
          strand_id: true,
          level_id: true,
          program: { select: { name: true } },
          course: {
            select: { name: true, program: { select: { name: true } } },
          },
          strand: {
            select: { name: true, program: { select: { name: true } } },
          },
          level: { select: { name: true } },
        },
      },
      educator: {
        include: {
          profile: {
            select: {
              full_name: true,
            },
          },
        },
      },
    };

    const [data, total] = await Promise.all([
      this.db.class.findMany({
        where,
        include,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.class.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Returns the distinct educators who have at least one non-deleted class
   * matching the given scope. Used by the Classes page Educator filter so
   * it only lists teachers relevant to the currently selected
   * Department/Semester — not every educator in the org.
   */
  async findDistinctEducators(
    orgId: string,
    filters: {
      schoolYearId?: string;
      semesterId?: string;
      programId?: string;
    },
  ) {
    const where: any = {
      org_id: orgId,
      deleted_at: null,
      ...(filters.schoolYearId && { school_year_id: filters.schoolYearId }),
      ...(filters.semesterId && { semester_id: filters.semesterId }),
      ...(filters.programId && {
        subject: {
          OR: [
            { program_id: filters.programId },
            { course: { program_id: filters.programId } },
            { strand: { program_id: filters.programId } },
          ],
        },
      }),
    };

    const rows = await this.db.class.findMany({
      where,
      distinct: ['educator_id'],
      select: {
        educator: {
          select: {
            id: true,
            profile: { select: { full_name: true } },
          },
        },
      },
    });

    return rows
      .map((r) => ({
        id: r.educator.id,
        fullName: r.educator.profile?.full_name ?? '',
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async findById(id: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
        _count: {
          select: { enrollments: true },
        },
        schedules: true,
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      educatorId?: string;
      sectionId?: string | null;
      capacity?: number;
    },
  ) {
    return this.db.class.update({
      where: { id },
      data: {
        ...(data.educatorId !== undefined && { educator_id: data.educatorId }),
        ...(data.sectionId !== undefined && { section_id: data.sectionId }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      },
      include: {
        schedules: true,
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
      },
    });
  }

  /**
   * Returns a Map<educatorId, classCount> counting only non-deleted classes.
   * Empty input returns an empty Map (avoids a pointless `in: []` query).
   */
  async countAssignedClasses(
    orgId: string,
    educatorIds: string[],
  ): Promise<Map<string, number>> {
    if (educatorIds.length === 0) return new Map();

    const rows = await this.db.class.groupBy({
      by: ['educator_id'],
      where: {
        org_id: orgId,
        educator_id: { in: educatorIds },
        deleted_at: null,
      },
      _count: { _all: true },
    });

    return new Map(rows.map((r) => [r.educator_id, r._count._all]));
  }

  async findActiveClassesByEducator(educatorId: string, orgId: string) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        educator_id: educatorId,
        deleted_at: null,
      },
      include: {
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
      },
    });
  }

  async findTeachingHistoryByEducator(educatorId: string, orgId: string) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        educator_id: educatorId,
      },
      include: {
        subject: { select: { id: true, name: true } },
        schoolYear: { select: { id: true, name: true, status: true } },
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
      },
      orderBy: [{ school_year_id: 'asc' }, { created_at: 'asc' }],
    });
  }

  async findEducatorSchedules(
    educatorId: string,
    orgId: string,
    schoolYearId: string,
  ) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: {
          educator_id: educatorId,
          school_year_id: schoolYearId,
          deleted_at: null,
        },
      },
      include: {
        class: {
          include: {
            educator: {
              include: {
                profile: { select: { full_name: true } },
              },
            },
          },
        },
      },
    });
  }

  async findSchedulesByClass(classId: string) {
    return this.db.classSchedule.findMany({
      where: { class_id: classId },
    });
  }

  async findSectionSchedules(
    sectionId: string,
    orgId: string,
    schoolYearId: string,
  ) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: {
          section_id: sectionId,
          school_year_id: schoolYearId,
          deleted_at: null,
        },
      },
      include: { class: true },
    });
  }

  async findBySchoolYear(schoolYearId: string, orgId: string) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        deleted_at: null,
      },
      include: {
        educator: {
          include: {
            profile: { select: { full_name: true } },
          },
        },
      },
    });
  }

  async findEnrolledStudents(classId: string, orgId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: { class_id: classId, org_id: orgId, status: { not: 'removed' } },
      select: { student_id: true },
    });

    const studentIds = enrollments.map((e) => e.student_id);
    if (!studentIds.length) return [];

    const profiles = await this.db.profile.findMany({
      where: { account_id: { in: studentIds } },
      select: {
        account_id: true,
        full_name: true,
        account: { select: { email: true } },
      },
    });

    return profiles.map((p) => ({
      id: p.account_id,
      fullName: p.full_name,
      email: p.account.email,
    }));
  }

  /**
   * Returns only students whose academic structure matches the class's subject
   * (same program, and same course/strand/level when the class requires them),
   * enrolled for the class's school year, not already enrolled in the class,
   * and whose account is active. Unused `search` filters by name / Student ID.
   */
  async findEligibleStudents(classId: string, orgId: string, search?: string) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { school_year_id: true, section_id: true, subject_id: true },
    });
    if (!cls) return null;

    const subjectStructure = await resolveSubjectAcademicStructure(
      this.db,
      cls.subject_id,
      orgId,
    );
    if (!subjectStructure.programId) return [];

    const enrolled = await this.db.enrollment.findMany({
      where: { class_id: classId, org_id: orgId, status: { not: 'removed' } },
      select: { student_id: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.student_id));

    const speWhere: Prisma.StudentProgramEnrollmentWhereInput = {
      org_id: orgId,
      status: 'active',
      program_id: subjectStructure.programId,
      ...(subjectStructure.courseIds.length > 0
        ? { course_id: { in: subjectStructure.courseIds } }
        : {}),
      ...(subjectStructure.strandIds.length > 0
        ? { strand_id: { in: subjectStructure.strandIds } }
        : {}),
      ...(subjectStructure.levelIds.length > 0
        ? { level_id: { in: subjectStructure.levelIds } }
        : {}),
      ...(cls.section_id ? { section_id: cls.section_id } : {}),
      studentSchoolYear: { school_year_id: cls.school_year_id },
    };

    const spEnrollments = await this.db.studentProgramEnrollment.findMany({
      where: speWhere,
      include: {
        studentSchoolYear: { select: { student_id: true } },
        program: { select: { name: true } },
        level: { select: { name: true } },
        course: { select: { name: true } },
        strand: { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    // One record per student (dedupe across multiple program enrollments).
    const byStudent = new Map<string, (typeof spEnrollments)[number]>();
    for (const pe of spEnrollments) {
      const studentId = pe.studentSchoolYear.student_id;
      if (enrolledIds.has(studentId) || byStudent.has(studentId)) continue;
      byStudent.set(studentId, pe);
    }

    if (byStudent.size === 0) return [];

    const accounts = await this.db.account.findMany({
      where: {
        id: { in: [...byStudent.keys()] },
        org_id: orgId,
        role: 'student',
        status: 'active',
        deleted_at: null,
        ...(search
          ? {
              OR: [
                {
                  profile: {
                    full_name: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  profile: {
                    metadata: { path: ['studentId'], string_contains: search },
                  },
                },
              ],
            }
          : {}),
      },
      include: { profile: true },
      orderBy: { created_at: 'desc' },
    });

    return accounts.map((account) => {
      const meta = account.profile?.metadata;
      const metaObj =
        meta && typeof meta === 'object' && !Array.isArray(meta)
          ? (meta as Record<string, any>)
          : {};
      const pe = byStudent.get(account.id);
      return {
        id: account.id,
        orgId: account.org_id,
        email: account.email,
        status: account.status,
        fullName: account.profile?.full_name ?? null,
        studentId: metaObj['studentId'] ?? null,
        levelId: pe?.level_id ?? metaObj['levelId'] ?? null,
        levelName: pe?.level?.name ?? null,
        sectionId: pe?.section_id ?? metaObj['sectionId'] ?? null,
        sectionName: pe?.section?.name ?? null,
        programName: pe?.program?.name ?? null,
        courseName: pe?.course?.name ?? null,
        strandName: pe?.strand?.name ?? null,
        createdAt: account.created_at,
      };
    });
  }

  async replaceSchedules(
    orgId: string,
    classId: string,
    slots: Array<{ weekday: number; startTime: Date; endTime: Date }>,
  ) {
    await this.db.classSchedule.deleteMany({ where: { class_id: classId } });

    if (!slots.length) return [];

    return this.db.classSchedule.createMany({
      data: slots.map((s) => ({
        org_id: orgId,
        class_id: classId,
        weekday: s.weekday,
        start_time: s.startTime,
        end_time: s.endTime,
      })),
    });
  }

  async createOwnershipLog(data: any) {
    return this.db.classOwnershipLog.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        from_educator_id: data.fromEducatorId,
        to_educator_id: data.toEducatorId,
        reason: data.reason ?? null,
        reassigned_by: data.reassignedBy,
      },
    });
  }

  async findOwnershipHistory(classId: string, orgId: string) {
    return this.db.classOwnershipLog.findMany({
      where: { class_id: classId, org_id: orgId },
      orderBy: { reassigned_at: 'asc' },
    });
  }

  async lockGradingSchemeForClass(classId: string, orgId: string) {
    return this.db.gradingScheme.updateMany({
      where: {
        class_id: classId,
        org_id: orgId,
        is_locked: false,
      },
      data: {
        is_locked: true,
        locked_at: new Date(),
      },
    });
  }

  async softDelete(id: string) {
    return this.db.class.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async findSubjectWithEducator(id: string) {
    const cls = await this.db.class.findUnique({
      where: { id },
      include: {
        subject: true,
        educator: {
          include: {
            profile: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    if (!cls) {
      throw new Error('Class not found');
    }

    return {
      subject: cls.subject,
      educatorProfile: cls.educator.profile,
    };
  }
}