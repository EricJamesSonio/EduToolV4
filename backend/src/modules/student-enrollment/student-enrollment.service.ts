import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { StudentEnrollmentRepository } from './student-enrollment.repository'
import {
  EnrollStudentDto,
  BulkEnrollStudentsDto,
  UpdateSchoolYearEnrollmentDto,
  EnrollStudentProgramDto,
  UpdateProgramEnrollmentDto,
} from './dto/student-enrollment.dto'
import { SchoolYearEnrollmentStatus } from '@prisma/client'

@Injectable()
export class StudentEnrollmentService {
  constructor(private readonly repo: StudentEnrollmentRepository) {}

  // ── School-Year Enrollment ────────────────────────────────────────────────

  getEnrolledStudents(schoolYearId: string, orgId: string) {
    return this.repo.findAllBySchoolYear(schoolYearId, orgId)
  }

  async enrollStudent(schoolYearId: string, orgId: string, dto: EnrollStudentDto) {
    // Prevent duplicate enrollment in same school year
    const existing = await this.repo.findByStudentAndSchoolYear(
      dto.student_id,
      schoolYearId,
      orgId,
    )
    if (existing) {
      throw new ConflictException('Student is already enrolled in this school year.')
    }

    // Enforce: student cannot be active in more than one school year at a time
    const activeElsewhere = await this.repo.findActiveEnrollmentForStudent(dto.student_id, orgId)
    if (activeElsewhere) {
      throw new ConflictException(
        `Student is already actively enrolled in "${activeElsewhere.schoolYear.name}". Unenroll them first.`,
      )
    }

    return this.repo.enrollStudent(orgId, schoolYearId, dto.student_id, dto.notes)
  }

  async bulkEnrollStudents(schoolYearId: string, orgId: string, dto: BulkEnrollStudentsDto) {
    const results = await Promise.allSettled(
      dto.students.map((s) => this.enrollStudent(schoolYearId, orgId, s)),
    )

    const enrolled: string[] = []
    const failed:   { student_id: string; reason: string }[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        enrolled.push(dto.students[i].student_id)
      } else {
        failed.push({
          student_id: dto.students[i].student_id,
          reason:     (result.reason as Error)?.message ?? 'Unknown error',
        })
      }
    })

    return { enrolled, failed }
  }

  async unenrollStudent(enrollmentId: string, orgId: string) {
    const record = await this.repo.findEnrollmentById(enrollmentId, orgId)
    if (!record) throw new NotFoundException('Enrollment not found.')
    if (record.status === SchoolYearEnrollmentStatus.unenrolled) {
      throw new BadRequestException('Student is already unenrolled.')
    }
    return this.repo.unenrollStudent(enrollmentId)
  }

  async updateEnrollment(
    enrollmentId: string,
    orgId:        string,
    dto:          UpdateSchoolYearEnrollmentDto,
  ) {
    const record = await this.repo.findEnrollmentById(enrollmentId, orgId)
    if (!record) throw new NotFoundException('Enrollment not found.')
    return this.repo.updateEnrollmentStatus(enrollmentId, dto.status, dto.notes)
  }

  // Called by scheduler when a school year ends
  autoUnenrollBySchoolYear(schoolYearId: string) {
    return this.repo.autoUnenrollBySchoolYear(schoolYearId)
  }

  // ── Program Enrollment ────────────────────────────────────────────────────

  async enrollInProgram(
    schoolYearId: string,
    studentId:    string,
    orgId:        string,
    dto:          EnrollStudentProgramDto,
  ) {
    // Student must be enrolled in the school year first
    const schoolYearEnrollment = await this.repo.findByStudentAndSchoolYear(
      studentId,
      schoolYearId,
      orgId,
    )
    if (!schoolYearEnrollment) {
      throw new BadRequestException('Student is not enrolled in this school year.')
    }
    if (schoolYearEnrollment.status !== SchoolYearEnrollmentStatus.active) {
      throw new BadRequestException('Student school year enrollment is not active.')
    }

    // Prevent duplicate program enrollment
    const alreadyInProgram = schoolYearEnrollment.programEnrollments?.find(
      (p) => p.program_id === dto.program_id,
    )
    if (alreadyInProgram) {
      throw new ConflictException(
        'Student is already enrolled in this program for this school year.',
      )
    }

    return this.repo.enrollInProgram(orgId, schoolYearEnrollment.id, dto)
  }

  async updateProgramEnrollment(
    programEnrollmentId: string,
    orgId:               string,
    dto:                 UpdateProgramEnrollmentDto,
  ) {
    const record = await this.repo.findProgramEnrollmentById(programEnrollmentId)
    if (!record || record.org_id !== orgId) {
      throw new NotFoundException('Program enrollment not found.')
    }
    return this.repo.updateProgramEnrollment(programEnrollmentId, dto)
  }

  async removeProgramEnrollment(programEnrollmentId: string, orgId: string) {
    const record = await this.repo.findProgramEnrollmentById(programEnrollmentId)
    if (!record || record.org_id !== orgId) {
      throw new NotFoundException('Program enrollment not found.')
    }
    return this.repo.removeProgramEnrollment(programEnrollmentId)
  }
}