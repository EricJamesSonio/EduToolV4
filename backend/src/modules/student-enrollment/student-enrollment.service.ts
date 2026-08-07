import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { StudentEnrollmentRepository } from './student-enrollment.repository'
import { AuditLogService } from '../audit-log/audit-log.service'
import {
  EnrollStudentDto,
  BulkEnrollStudentsDto,
  UpdateSchoolYearEnrollmentDto,
  EnrollStudentProgramDto,
  UpdateProgramEnrollmentDto,
} from './dto/student-enrollment.dto'
import { SchoolYearEnrollmentStatus, Prisma } from '@prisma/client'

@Injectable()
export class StudentEnrollmentService {
  constructor(
    private readonly repo: StudentEnrollmentRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ── School-Year Enrollment ────────────────────────────────────────────────

  async getEnrolledStudents(
    schoolYearId: string,
    orgId:        string,
    page:         number,
    limit:        number,
  ) {
    const [data, total] = await this.repo.findAllBySchoolYear(schoolYearId, orgId, page, limit)
    return { data, total, page, limit }
  }

  async enrollStudent(schoolYearId: string, orgId: string, dto: EnrollStudentDto, actorId: string, tx?: Prisma.TransactionClient) {
    const existing = await this.repo.findByStudentAndSchoolYear(
      dto.student_id,
      schoolYearId,
      orgId,
    )
    if (existing) {
      throw new ConflictException('Student is already enrolled in this school year.')
    }

    const activeElsewhere = await this.repo.findActiveEnrollmentForStudent(dto.student_id, orgId)
    if (activeElsewhere) {
      throw new ConflictException(
        `Student is already actively enrolled in "${activeElsewhere.schoolYear.name}". Unenroll them first.`,
      )
    }

    const enrollment = await this.repo.enrollStudent(orgId, schoolYearId, dto.student_id, dto.notes, tx)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_created',
      entityType: 'school_year_enrollment',
      entityId: enrollment.id,
      metadata: { studentId: dto.student_id, schoolYearId },
    }).catch(() => {});

    return enrollment
  }

  async bulkEnrollStudents(schoolYearId: string, orgId: string, dto: BulkEnrollStudentsDto, actorId: string) {
    const results = await Promise.allSettled(
      dto.students.map((s) => this.enrollStudent(schoolYearId, orgId, s, actorId)),
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

  async unenrollStudent(enrollmentId: string, orgId: string, actorId: string) {
    const record = await this.repo.findEnrollmentById(enrollmentId, orgId)
    if (!record) throw new NotFoundException('Enrollment not found.')
    if (record.status === SchoolYearEnrollmentStatus.unenrolled) {
      throw new BadRequestException('Student is already unenrolled.')
    }
    const result = await this.repo.unenrollStudent(enrollmentId)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_removed',
      entityType: 'school_year_enrollment',
      entityId: enrollmentId,
      metadata: { studentId: record.student_id },
    }).catch(() => {});

    return result
  }

  async updateEnrollment(
    enrollmentId: string,
    orgId:        string,
    dto:          UpdateSchoolYearEnrollmentDto,
    actorId:      string,
  ) {
    const record = await this.repo.findEnrollmentById(enrollmentId, orgId)
    if (!record) throw new NotFoundException('Enrollment not found.')
    const result = await this.repo.updateEnrollmentStatus(enrollmentId, dto.status, dto.notes)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_updated',
      entityType: 'school_year_enrollment',
      entityId: enrollmentId,
      metadata: { status: dto.status, studentId: record.student_id },
    }).catch(() => {});

    return result
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
    actorId:      string,
    tx?:          Prisma.TransactionClient,
  ) {
    // Student must be enrolled in the school year first
    const schoolYearEnrollment = await this.repo.findByStudentAndSchoolYear(
      studentId,
      schoolYearId,
      orgId,
      tx,
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

    const programEnrollment = await this.repo.enrollInProgram(orgId, schoolYearEnrollment.id, dto, tx)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_created',
      entityType: 'program_enrollment',
      entityId: programEnrollment.id,
      metadata: { studentId, programId: dto.program_id },
    }).catch(() => {});

    return programEnrollment
  }

  async updateProgramEnrollment(
    programEnrollmentId: string,
    orgId:               string,
    dto:                 UpdateProgramEnrollmentDto,
    actorId:             string,
  ) {
    const record = await this.repo.findProgramEnrollmentById(programEnrollmentId)
    if (!record || record.org_id !== orgId) {
      throw new NotFoundException('Program enrollment not found.')
    }
    const result = await this.repo.updateProgramEnrollment(programEnrollmentId, dto)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_updated',
      entityType: 'program_enrollment',
      entityId: programEnrollmentId,
    }).catch(() => {});

    return result
  }

  async removeProgramEnrollment(programEnrollmentId: string, orgId: string, actorId: string) {
    const record = await this.repo.findProgramEnrollmentById(programEnrollmentId)
    if (!record || record.org_id !== orgId) {
      throw new NotFoundException('Program enrollment not found.')
    }
    await this.repo.removeProgramEnrollment(programEnrollmentId)

    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action: 'enrollment_removed',
      entityType: 'program_enrollment',
      entityId: programEnrollmentId,
    }).catch(() => {});
  }
}