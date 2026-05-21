import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string
    classId: string
    studentId: string
    status: string
  }) {
    return this.db.enrollment.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        student_id: data.studentId,
        status: data.status as any,
      },
    })
  }

  async findByClass(classId: string, orgId: string) {
    return this.db.enrollment.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        status: { not: 'removed' },
      },
      orderBy: { created_at: 'asc' },
    })
  }

  async findById(id: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { id, org_id: orgId },
    })
  }

  async findByStudent(classId: string, studentId: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { class_id: classId, student_id: studentId, org_id: orgId },
    })
  }

  // Checks if student is already enrolled in the same subject within the same semester
  // Prevents duplicate enrollment across parallel classes for the same subject
  async findDuplicate(
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
    })
  }

  async countActive(classId: string): Promise<number> {
    return this.db.enrollment.count({
      where: { class_id: classId, status: 'active' },
    })
  }

  async updateStatus(id: string, status: string) {
    return this.db.enrollment.update({
      where: { id },
      data: { status: status as any },
    })
  }

  async remove(id: string) {
    return this.db.enrollment.update({
      where: { id },
      data: { status: 'removed' as any },
    })
  }

  async findByStudentAcrossOrg(studentId: string, orgId: string) {
    return this.db.enrollment.findMany({
      where: {
        student_id: studentId,
        org_id: orgId,
        status: 'active',
        class: { deleted_at: null },
      },
      include: {
        class: {
          include: {
            schedules: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    })
  }

  async findOneByStudentAndClass(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    return this.db.enrollment.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        org_id: orgId,
        status: 'active',
        class: { deleted_at: null },
      },
      include: {
        class: {
          include: { schedules: true },
        },
      },
    })
  }

  // Fetches all prerequisite subjects + the student's locked Grade records for them
  // Used by the eligibility check before enrollment is allowed
  async getPrerequisitesWithGrades(
    subjectId: string,
    studentId: string,
    orgId: string,
  ) {
    const prereqs = await this.db.subjectPrerequisite.findMany({
      where: { subject_id: subjectId, org_id: orgId },
      include: {
        prerequisite: {
          select: { id: true, name: true },
        },
      },
    })

    if (prereqs.length === 0) return []

    const prereqSubjectIds = prereqs.map((p) => p.prerequisite_id)

    const grades = await this.db.grade.findMany({
      where: {
        org_id: orgId,
        student_id: studentId,
        is_locked: true,
        class: {
          subject_id: { in: prereqSubjectIds },
        },
      },
      include: {
        class: { select: { subject_id: true } },
      },
    })

    return prereqs.map((p) => ({
      subject_id: p.prerequisite_id,
      subject_name: p.prerequisite.name,
      grade: grades.find((g) => g.class.subject_id === p.prerequisite_id) ?? null,
    }))
  }
}