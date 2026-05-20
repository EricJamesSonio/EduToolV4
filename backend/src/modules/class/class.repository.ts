import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

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

  async findAll(orgId: string, filters: any) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        ...(filters.schoolYearId && { school_year_id: filters.schoolYearId }),
        ...(filters.semesterId && { semester_id: filters.semesterId }),
        ...(filters.educatorId && { educator_id: filters.educatorId }),
        ...(filters.subjectId && { subject_id: filters.subjectId }),
        ...(filters.sectionId && { section_id: filters.sectionId }),
      },
      include: {
        schedules: true,
        subject: {
          select: {
            id: true,
            name: true,
            program_id: true,
            course_id: true,
            strand_id: true,
            level_id: true,
            course: { select: { program_id: true } },
            strand: { select: { program_id: true } },
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
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
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

  async findEducatorSchedules(educatorId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: { educator_id: educatorId, deleted_at: null },
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

  async findSectionSchedules(sectionId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: { section_id: sectionId, deleted_at: null },
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
      where: {
        class_id: classId,
        org_id: orgId,
        status: { not: 'removed' },
      },
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
