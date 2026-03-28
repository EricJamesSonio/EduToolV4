import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class ClassRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string
    subjectId: string
    educatorId: string
    sectionId?: string
    schoolYearId: string
    semesterId: string
    capacity: number
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
      include: { schedules: true },
    })
  }

  async findAll(
    orgId: string,
    filters: {
      schoolYearId?: string
      semesterId?: string
      educatorId?: string
      subjectId?: string
      sectionId?: string
    },
  ) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        ...(filters.schoolYearId ? { school_year_id: filters.schoolYearId } : {}),
        ...(filters.semesterId ? { semester_id: filters.semesterId } : {}),
        ...(filters.educatorId ? { educator_id: filters.educatorId } : {}),
        ...(filters.subjectId ? { subject_id: filters.subjectId } : {}),
        ...(filters.sectionId ? { section_id: filters.sectionId } : {}),
      },
      include: { schedules: true },
      orderBy: { created_at: 'desc' },
    })
  }

  async findById(id: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: { schedules: true },
    })
  }

  async update(
    id: string,
    data: {
      educatorId?: string
      sectionId?: string | null
      capacity?: number
    },
  ) {
    return this.db.class.update({
      where: { id },
      data: {
        ...(data.educatorId !== undefined ? { educator_id: data.educatorId } : {}),
        ...(data.sectionId !== undefined ? { section_id: data.sectionId } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      },
      include: { schedules: true },
    })
  }

  async softDelete(id: string) {
    return this.db.class.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
  }

  async replaceSchedules(
    orgId: string,
    classId: string,
    slots: Array<{ weekday: number; startTime: Date; endTime: Date }>,
  ) {
    await this.db.classSchedule.deleteMany({ where: { class_id: classId } })
    if (slots.length === 0) return []
    return this.db.classSchedule.createMany({
      data: slots.map((s) => ({
        org_id: orgId,
        class_id: classId,
        weekday: s.weekday,
        start_time: s.startTime,
        end_time: s.endTime,
      })),
    })
  }

  async findEducatorSchedules(educatorId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: { educator_id: educatorId, deleted_at: null },
      },
      include: { class: true },
    })
  }

  async findSectionSchedules(sectionId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: { section_id: sectionId, deleted_at: null },
      },
      include: { class: true },
    })
  }

  async findActiveClassesByEducator(educatorId: string, orgId: string) {
    return this.db.class.findMany({
      where: { org_id: orgId, educator_id: educatorId, deleted_at: null },
    })
  }

  async findBySchoolYear(schoolYearId: string, orgId: string) {
    return this.db.class.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
    })
  }

  async findSubjectWithEducator(
    subjectId: string,
    educatorId: string,
    orgId: string,
  ) {
    const [subject, educatorProfile] = await Promise.all([
      this.db.subject.findFirst({
        where: { id: subjectId, org_id: orgId },
        select: { id: true, name: true, level_id: true },
      }),
      this.db.profile.findFirst({
        where: { account: { id: educatorId } },
        select: { full_name: true },
      }),
    ])
    return { subject, educatorProfile }
  }

  async createOwnershipLog(data: {
    orgId: string
    classId: string
    fromEducatorId: string
    toEducatorId: string
    reason?: string
    reassignedBy: string
  }) {
    return this.db.classOwnershipLog.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        from_educator_id: data.fromEducatorId,
        to_educator_id: data.toEducatorId,
        reason: data.reason ?? null,
        reassigned_by: data.reassignedBy,
      },
    })
  }

  async findOwnershipHistory(classId: string, orgId: string) {
    return this.db.classOwnershipLog.findMany({
      where: { class_id: classId, org_id: orgId },
      orderBy: { reassigned_at: 'asc' },
    })
  }

  async lockRubricForClass(classId: string, orgId: string) {
    return this.db.rubric.updateMany({
      where: { class_id: classId, org_id: orgId, is_locked: false },
      data: { is_locked: true, locked_at: new Date() },
    })
  }
}