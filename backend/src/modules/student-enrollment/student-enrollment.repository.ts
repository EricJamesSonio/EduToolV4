import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { SchoolYearEnrollmentStatus, EnrollmentStatus, Prisma } from '@prisma/client'

@Injectable()
export class StudentEnrollmentRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── School-Year Enrollment ────────────────────────────────────────────────

findAllBySchoolYear(
  schoolYearId: string,
  orgId:        string,
  page:         number,
  limit:        number,
) {
  const where = { school_year_id: schoolYearId, org_id: orgId }

  return Promise.all([
    this.db.studentSchoolYear.findMany({
      where,
      include: {
        programEnrollments: {
          include: {
            program: true,
            level:   true,
            course:  true,
            strand:  true,
            section: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.db.studentSchoolYear.count({ where }),
  ])
}

  findEnrollmentById(id: string, orgId: string) {
    return this.db.studentSchoolYear.findFirst({
      where: { id, org_id: orgId },
      include: { programEnrollments: true },
    })
  }

  findByStudentAndSchoolYear(
    studentId: string,
    schoolYearId: string,
    orgId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.db;
    return client.studentSchoolYear.findUnique({
      where: {
        org_id_student_id_school_year_id: {
          org_id:         orgId,
          student_id:     studentId,
          school_year_id: schoolYearId,
        },
      },
      include: { programEnrollments: true },
    })
  }

  findActiveEnrollmentForStudent(studentId: string, orgId: string) {
    return this.db.studentSchoolYear.findFirst({
      where: {
        student_id: studentId,
        org_id:     orgId,
        status:     SchoolYearEnrollmentStatus.active,
      },
      include: { schoolYear: true },
    })
  }

  enrollStudent(
    orgId: string,
    schoolYearId: string,
    studentId: string,
    notes?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.db;
    return client.studentSchoolYear.create({
      data: {
        org_id:         orgId,
        school_year_id: schoolYearId,
        student_id:     studentId,
        status:         SchoolYearEnrollmentStatus.active,
        notes:          notes ?? null,
      },
    })
  }

  unenrollStudent(id: string) {
    return this.db.studentSchoolYear.update({
      where: { id },
      data: {
        status:        SchoolYearEnrollmentStatus.unenrolled,
        unenrolled_at: new Date(),
      },
    })
  }

  updateEnrollmentStatus(id: string, status: SchoolYearEnrollmentStatus, notes?: string) {
    return this.db.studentSchoolYear.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
        ...(status === SchoolYearEnrollmentStatus.unenrolled && { unenrolled_at: new Date() }),
      },
    })
  }

  autoUnenrollBySchoolYear(schoolYearId: string) {
    return this.db.studentSchoolYear.updateMany({
      where: {
        school_year_id: schoolYearId,
        status:         SchoolYearEnrollmentStatus.active,
      },
      data: {
        status:        SchoolYearEnrollmentStatus.unenrolled,
        unenrolled_at: new Date(),
      },
    })
  }

  // ── Program Enrollment ────────────────────────────────────────────────────

  findProgramEnrollmentById(id: string) {
    return this.db.studentProgramEnrollment.findUnique({
      where: { id },
      include: {
        program: true,
        level:   true,
        course:  true,
        strand:  true,
        section: true,
      },
    })
  }

  enrollInProgram(
    orgId:               string,
    studentSchoolYearId: string,
    data: {
      program_id:  string
      level_id?:   string
      course_id?:  string
      strand_id?:  string
      section_id?: string
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.db;
    return client.studentProgramEnrollment.create({
      data: {
        org_id:                 orgId,
        student_school_year_id: studentSchoolYearId,
        program_id:             data.program_id,
        level_id:               data.level_id   ?? null,
        course_id:              data.course_id  ?? null,
        strand_id:              data.strand_id  ?? null,
        section_id:             data.section_id ?? null,
        status:                 EnrollmentStatus.active,
      },
      include: {
        program: true,
        level:   true,
        course:  true,
        strand:  true,
        section: true,
      },
    })
  }

  updateProgramEnrollment(
    id:   string,
    data: {
      level_id?:   string | null
      course_id?:  string | null
      strand_id?:  string | null
      section_id?: string | null
    },
  ) {
    return this.db.studentProgramEnrollment.update({
      where: { id },
      data: {
        ...(data.level_id   !== undefined && { level_id:   data.level_id }),
        ...(data.course_id  !== undefined && { course_id:  data.course_id }),
        ...(data.strand_id  !== undefined && { strand_id:  data.strand_id }),
        ...(data.section_id !== undefined && { section_id: data.section_id }),
      },
      include: {
        program: true,
        level:   true,
        course:  true,
        strand:  true,
        section: true,
      },
    })
  }

  removeProgramEnrollment(id: string) {
    return this.db.studentProgramEnrollment.delete({ where: { id } })
  }
}