// src/modules/class/class.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class ClassRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Class CRUD ───────────────────────────────────────────────────────────────

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
      include: { schedules: true },
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
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: { schedules: true },
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
        ...(data.educatorId !== undefined ? { educator_id: data.educatorId } : {}),
        ...(data.sectionId !== undefined ? { section_id: data.sectionId } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      },
      include: { schedules: true },
    });
  }

  async softDelete(id: string) {
    return this.db.class.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Schedules ────────────────────────────────────────────────────────────────

  async replaceSchedules(
    orgId: string,
    classId: string,
    slots: Array<{ weekday: number; startTime: Date; endTime: Date }>,
  ) {
    await this.db.classSchedule.deleteMany({ where: { class_id: classId } });

    if (slots.length === 0) return [];

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

  /**
   * Find all schedules for a given educator to detect time conflicts.
   */
  async findEducatorSchedules(educatorId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: {
          educator_id: educatorId,
          deleted_at: null,
        },
      },
      include: { class: true },
    });
  }

  /**
   * Find all schedules for a given section to detect time conflicts.
   */
  async findSectionSchedules(sectionId: string, orgId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: {
          section_id: sectionId,
          deleted_at: null,
        },
      },
      include: { class: true },
    });
  }

  // ── Enrollment ───────────────────────────────────────────────────────────────

  async createEnrollment(data: {
    orgId: string;
    classId: string;
    studentId: string;
    status: string;
  }) {
    return this.db.enrollment.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        student_id: data.studentId,
        status: data.status as any,
      },
    });
  }

  async findEnrollments(classId: string, orgId: string) {
    return this.db.enrollment.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        status: { not: 'removed' },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findEnrollmentById(id: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findEnrollmentByStudent(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    return this.db.enrollment.findFirst({
      where: { class_id: classId, student_id: studentId, org_id: orgId },
    });
  }

  /**
   * Check if a student is already enrolled in any class for the same subject
   * in the same semester — prevents duplicate enrollment.
   */
  async findDuplicateEnrollment(
    studentId: string,
    subjectId: string,
    semesterId: string,
    orgId: string,
  ) {
    return this.db.enrollment.findFirst({
      where: {
        org_id: orgId,
        student_id: studentId,
        status: { not: 'removed' },
        class: {
          subject_id: subjectId,
          semester_id: semesterId,
          deleted_at: null,
        },
      },
    });
  }

  async countActiveEnrollments(classId: string): Promise<number> {
    return this.db.enrollment.count({
      where: { class_id: classId, status: 'active' },
    });
  }

  async updateEnrollmentStatus(id: string, status: string) {
    return this.db.enrollment.update({
      where: { id },
      data: { status: status as any },
    });
  }

  /**
   * Find all active classes for an educator.
   * Used before allowing educator removal.
   */
  async findActiveClassesByEducator(educatorId: string, orgId: string) {
    return this.db.class.findMany({
      where: {
        org_id: orgId,
        educator_id: educatorId,
        deleted_at: null,
      },
    });
  }

  /**
   * Check whether a class has any active enrollments.
   * Used before archiving.
   */
  async hasActiveEnrollments(classId: string): Promise<boolean> {
    const count = await this.db.enrollment.count({
      where: { class_id: classId, status: 'active' },
    });
    return count > 0;
  }
}