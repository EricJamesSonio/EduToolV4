import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { EnrollmentRepository } from './enrollment.repository'
import { UpdateEnrollmentDto, PrerequisiteCheckResultDto } from './dto/enrollment.dto'
import {
  resolveSubjectAcademicStructure,
  isEligibleForClassStructure,
} from './enrollment-eligibility.util'

// Minimum passing score — adjust if your grading scale differs per org
const PASSING_SCORE = 75

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── Prerequisite gate ───────────────────────────────────────────────────

  /**
   * Checks whether a student meets all prerequisites for a subject before
   * enrollment is allowed. Called internally by enrollStudent().
   *
   * Returns { eligible: true } if all prerequisites are met.
   * Returns { eligible: false, missing: [...] } with a reason per failure:
   *   - 'not_taken'  — no grade record found for the prerequisite
   *   - 'not_locked' — grade exists but hasn't been locked by educator yet
   *   - 'not_passed' — grade is locked but final_score is below PASSING_SCORE
   */
  async checkEligibility(
    subjectId: string,
    studentId: string,
    orgId: string,
  ): Promise<PrerequisiteCheckResultDto> {
    const rows = await this.enrollmentRepository.getPrerequisitesWithGrades(
      subjectId,
      studentId,
      orgId,
    )

    if (rows.length === 0) return { eligible: true, missing: [] }

    const missing: PrerequisiteCheckResultDto['missing'] = []

    for (const row of rows) {
      if (!row.grade) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_taken',
        })
        continue
      }

      if (!row.grade.is_locked) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_locked',
        })
        continue
      }

      if (row.grade.final_score < PASSING_SCORE) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_passed',
        })
      }
    }

    return { eligible: missing.length === 0, missing }
  }

  // ── Enrollment CRUD ─────────────────────────────────────────────────────

  /**
   * STRICT gate: a student may only be enrolled in a class when they belong to
   * the same academic structure the class's subject requires — program, and
   * (when the class defines them) course/strand and level. Students with no
   * complete academic placement are rejected.
   */
  private async assertAcademicEligibility(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const cls = await this.enrollmentRepository.findClassEnrollmentContext(
      classId,
      orgId,
    )
    if (!cls) throw new NotFoundException('Class not found.')

    const [subjectStructure, studentStructure] = await Promise.all([
      resolveSubjectAcademicStructure(this.db, cls.subject_id, orgId),
      this.enrollmentRepository.findStudentAcademicStructure(
        studentId,
        orgId,
        cls.school_year_id,
      ),
    ])

    if (
      !isEligibleForClassStructure(subjectStructure, studentStructure, cls.section_id)
    ) {
      const reason = !studentStructure
        ? 'The student has no active academic placement for this school year.'
        : 'The student does not belong to the same program, course/strand, or level assigned to this class.'
      throw new BadRequestException(
        `Student is not eligible for this class. ${reason}`,
      )
    }
  }

  async enroll(
    classId: string,
    subjectId: string,
    semesterId: string,
    capacity: number,
    studentId: string,
    orgId: string,
  ) {
    // 0. Academic structure gate — must match before anything else
    await this.assertAcademicEligibility(classId, studentId, orgId)

    // 1. Prerequisite gate — block before any other checks
    const eligibility = await this.checkEligibility(subjectId, studentId, orgId)
    if (!eligibility.eligible) {
      const detail = eligibility.missing
        .map((m) => `"${m.subject_name}" (${m.reason.replace('_', ' ')})`)
        .join(', ')
      throw new BadRequestException(
        `Student has not met the prerequisites for this subject: ${detail}.`,
      )
    }

    // 2. Prevent duplicate enrollment in same subject + semester across classes
    const duplicate = await this.enrollmentRepository.findDuplicate(
      studentId,
      subjectId,
      semesterId,
      orgId,
    )
    if (duplicate) {
      throw new ConflictException(
        'Student is already enrolled in a class for this subject in the same semester.',
      )
    }

    // 3. Prevent re-enrollment in the exact same class (unless previously removed)
    const existing = await this.enrollmentRepository.findByStudent(
      classId,
      studentId,
      orgId,
    )
    if (existing && existing.status !== 'removed') {
      throw new ConflictException('Student is already enrolled in this class.')
    }

    // 4. Capacity check — return overflow signal instead of hard error
    if (capacity > 0) {
      const activeCount = await this.enrollmentRepository.countActive(classId)
      if (activeCount >= capacity) {
        return {
          overflow: true,
          message:
            `Class is at full capacity (${capacity} students). ` +
            `Add a new parallel session or mark the student as pending enrollment.`,
          classId,
          studentId,
        }
      }
    }

    return this.enrollmentRepository.create({
      orgId,
      classId,
      studentId,
      status: 'active',
    })
  }

  async findByClass(classId: string, orgId: string) {
    return this.enrollmentRepository.findByClass(classId, orgId)
  }

  async updateStatus(
    classId: string,
    enrollmentId: string,
    orgId: string,
    dto: UpdateEnrollmentDto,
  ) {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId, orgId)
    if (!enrollment || enrollment.class_id !== classId) {
      throw new NotFoundException('Enrollment not found.')
    }
    return this.enrollmentRepository.updateStatus(enrollmentId, dto.status)
  }

  async remove(classId: string, enrollmentId: string, orgId: string) {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId, orgId)
    if (!enrollment || enrollment.class_id !== classId) {
      throw new NotFoundException('Enrollment not found.')
    }
    if (enrollment.status === 'removed') {
      throw new ConflictException('Enrollment has already been removed.')
    }
    return this.enrollmentRepository.remove(enrollmentId)
  }

  // ── Student-facing queries ───────────────────────────────────────────────

  async getStudentEnrollments(studentId: string, orgId: string) {
    return this.enrollmentRepository.findByStudentAcrossOrg(studentId, orgId)
  }

  async getStudentEnrollmentForClass(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.enrollmentRepository.findOneByStudentAndClass(
      classId,
      studentId,
      orgId,
    )
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class.')
    }
    return enrollment
  }

  async countActive(classId: string): Promise<number> {
    return this.enrollmentRepository.countActive(classId)
  }
}