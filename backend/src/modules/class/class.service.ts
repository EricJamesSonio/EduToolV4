// backend/src/modules/class/class.service.ts

import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { ClassRepository }    from './class.repository'
import { EnrollmentService }  from '../enrollment/enrollment.service'
import { AttendanceService }  from '../attendance/attendance.service'
import { DatabaseService }    from '@/core/database/database.provider'
import {
  CreateClassDto, UpdateClassDto, QueryClassDto,
  EnrollStudentDto, UpdateEnrollmentDto, ReassignEducatorDto, ScheduleSlotDto,
} from './dto/class.dto'

function parseTime(hhmm: string, referenceDate = new Date()): Date {
  const [hours, minutes] = hhmm.split(':').map(Number)
  const d = new Date(referenceDate)
  d.setHours(hours, minutes, 0, 0)
  return d
}

interface TimeSlot {
  weekday:   number
  startTime: Date
  endTime:   Date
}

function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.weekday !== b.weekday) return false
  return a.startTime < b.endTime && a.endTime > b.startTime
}

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepository:  ClassRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly attendanceService: AttendanceService,
    private readonly db:               DatabaseService,
  ) {}

  // ---------------------------------------------------------------------------
  // Resolve semester automatically from schoolYearId
  // ---------------------------------------------------------------------------

private async resolveProgramIdFromSubject(
  subjectId: string,
  orgId: string,
): Promise<string | null> {
  const subject = await this.db.subject.findFirst({
    where: { id: subjectId, org_id: orgId },
    select: {
      program_id: true,
      course_id:  true,
      strand_id:  true,
      level_id:   true,
    },
  })

  if (!subject) return null

  // Direct program link
  if (subject.program_id) return subject.program_id

  // Via course → program
  if (subject.course_id) {
    const course = await this.db.course.findFirst({
      where: { id: subject.course_id, org_id: orgId },
      select: { program_id: true },
    })
    if (course?.program_id) return course.program_id
  }

  // Via strand → program
  if (subject.strand_id) {
    const strand = await this.db.strand.findFirst({
      where: { id: subject.strand_id, org_id: orgId },
      select: { program_id: true },
    })
    if (strand?.program_id) return strand.program_id
  }

  // Via level → program  ← THIS was the missing path
  if (subject.level_id) {
    const level = await this.db.level.findFirst({
      where: { id: subject.level_id, org_id: orgId },
      select: { program_id: true },
    })
    if (level?.program_id) return level.program_id
  }

  // Via SubjectSharing
  const sharing = await this.db.subjectSharing.findFirst({
    where: { subject_id: subjectId, org_id: orgId },
    select: {
      course: { select: { program_id: true } },
      strand: { select: { program_id: true } },
      level:  { select: { program_id: true } },
    },
  })

  if (sharing?.course?.program_id) return sharing.course.program_id
  if (sharing?.strand?.program_id) return sharing.strand.program_id
  if (sharing?.level?.program_id)  return sharing.level.program_id

  return null
}

private async resolveSemesterId(
  schoolYearId: string,
  programId: string,
  orgId: string,
): Promise<string> {
  const assignment = await this.db.programSemesterAssignment.findFirst({
    where: { program_id: programId, org_id: orgId },
    include: {
      template: {
        include: {
          semesters: { orderBy: { order_index: 'asc' } },
        },
      },
    },
  })

  if (!assignment) {
    throw new BadRequestException(
      'No semester template is assigned to this program. Please assign one in Semester Settings before creating classes.',
    )
  }

  const firstTemplateSemester = assignment.template.semesters[0]

  if (!firstTemplateSemester) {
    throw new BadRequestException(
      'The assigned semester template has no semesters defined.',
    )
  }

  // Try matching by name first
  const semester = await this.db.semester.findFirst({
    where: {
      org_id:         orgId,
      school_year_id: schoolYearId,
      name:           firstTemplateSemester.name,
    },
    orderBy: { start_date: 'asc' },
  })

  if (semester) return semester.id

  // Fallback: any semester for this school year
  const fallback = await this.db.semester.findFirst({
    where: { org_id: orgId, school_year_id: schoolYearId },
    orderBy: { start_date: 'asc' },
  })

  if (!fallback) {
    throw new BadRequestException(
      'No semesters found for this school year. Please create semesters in Semester Settings first.',
    )
  }

  return fallback.id
}

async create(orgId: string, dto: CreateClassDto) {
  // ── DEBUG ──────────────────────────────────────────────────────────────
  const subjectDebug = await this.db.subject.findFirst({
    where: { id: dto.subjectId, org_id: orgId },
    select: {
      id:         true,
      name:       true,
      program_id: true,
      course_id:  true,
      strand_id:  true,
      level_id:   true,
    },
  })
  console.log('[DEBUG] Subject:', JSON.stringify(subjectDebug, null, 2))

  const sharingDebug = await this.db.subjectSharing.findMany({
    where: { subject_id: dto.subjectId },
  })
  console.log('[DEBUG] Sharings:', JSON.stringify(sharingDebug, null, 2))
  // ── END DEBUG ──────────────────────────────────────────────────────────

  const programId = await this.resolveProgramIdFromSubject(dto.subjectId, orgId)

  if (!programId) {
    throw new BadRequestException(
      'Could not determine the program for this subject. Ensure the subject is properly linked.',
    )
  }

  const semesterId = await this.resolveSemesterId(dto.schoolYearId, programId, orgId)

  const slots = this.parseSlots(dto.schedules)
  await this.assertNoEducatorConflict(dto.educatorId, orgId, slots)

  if (dto.sectionId) {
    await this.assertNoSectionConflict(dto.sectionId, orgId, slots)
  }

  const cls = await this.classRepository.create({
    orgId,
    subjectId:    dto.subjectId,
    educatorId:   dto.educatorId,
    sectionId:    dto.sectionId,
    schoolYearId: dto.schoolYearId,
    semesterId,
    capacity:     dto.capacity,
  })

  await this.classRepository.replaceSchedules(orgId, cls.id, slots)

  this.attendanceService
    .generateSessionsForClass(cls.id, orgId)
    .catch((err) => {
      console.error(`[AttendanceService] Failed to generate sessions for class ${cls.id}:`, err)
    })

  return this.classRepository.findById(cls.id, orgId)
}

    // --- everything below is unchanged from your original ---

  async findAll(orgId: string, query: QueryClassDto) {
    const classes = await this.classRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      semesterId:   query.semesterId,
      educatorId:   query.educatorId,
      subjectId:    query.subjectId,
      sectionId:    query.sectionId,
    })

return classes.map((cls) => {
  const subject = (cls as any).subject
  const educator = (cls as any).educator

  const programId =
    subject?.program_id ??
    subject?.course?.program_id ??
    subject?.strand?.program_id ??
    null

  return {
    ...cls,
    program_id:    programId,
    subject_name:  subject?.name ?? null,

    // ✅ THIS IS THE FIX
    educatorName: educator?.profile?.full_name ?? null,
  }
})
  }

  async findById(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return cls
  }

  async update(id: string, orgId: string, dto: UpdateClassDto) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')

    if (dto.schedules) {
      const slots      = this.parseSlots(dto.schedules)
      const educatorId = dto.educatorId ?? cls.educator_id
      const sectionId  = dto.sectionId  ?? cls.section_id ?? undefined

      await this.assertNoEducatorConflict(educatorId, orgId, slots, id)
      if (sectionId) await this.assertNoSectionConflict(sectionId, orgId, slots, id)
      await this.classRepository.replaceSchedules(orgId, id, slots)
    }

    return this.classRepository.update(id, {
      educatorId: dto.educatorId,
      sectionId:  dto.sectionId,
      capacity:   dto.capacity,
    })
  }

  async archive(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.classRepository.softDelete(id)
  }

  async enrollStudent(id: string, orgId: string, dto: EnrollStudentDto) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')

    const result = await this.enrollmentService.enroll(
      id, cls.subject_id, cls.semester_id, cls.capacity, dto.studentId, orgId,
    )

    if (!('overflow' in result)) {
      const activeCount = await this.enrollmentService.countActive(id)
      if (activeCount === 1) {
        await this.classRepository.lockGradingSchemeForClass(id, orgId)
      }
    }

    return result
  }

  async getEnrolledStudents(classId: string, orgId: string) {
    const cls = await this.classRepository.findById(classId, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.classRepository.findEnrolledStudents(classId, orgId)
  }

  async getEnrollments(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.enrollmentService.findByClass(id, orgId)
  }

  async updateEnrollment(classId: string, enrollmentId: string, orgId: string, dto: UpdateEnrollmentDto) {
    const cls = await this.classRepository.findById(classId, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.enrollmentService.updateStatus(classId, enrollmentId, orgId, dto)
  }

  async removeEnrollment(classId: string, enrollmentId: string, orgId: string) {
    const cls = await this.classRepository.findById(classId, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.enrollmentService.remove(classId, enrollmentId, orgId)
  }

  async reassignEducator(id: string, orgId: string, dto: ReassignEducatorDto, adminId: string) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')

    if (cls.educator_id === dto.educatorId) {
      throw new BadRequestException('The class is already assigned to this educator.')
    }

    const existingSchedules = cls.schedules as any[]
    const slots: TimeSlot[] = existingSchedules.map((s) => ({
      weekday:   s.weekday,
      startTime: new Date(s.start_time),
      endTime:   new Date(s.end_time),
    }))

    await this.assertNoEducatorConflict(dto.educatorId, orgId, slots, id)
    await this.classRepository.createOwnershipLog({
      orgId, classId: id,
      fromEducatorId: cls.educator_id,
      toEducatorId:   dto.educatorId,
      reason:         dto.reason,
      reassignedBy:   adminId,
    })

    return this.classRepository.update(id, { educatorId: dto.educatorId })
  }

  async getOwnershipHistory(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId)
    if (!cls) throw new NotFoundException('Class not found.')
    return this.classRepository.findOwnershipHistory(id, orgId)
  }

  async hasActiveClasses(educatorId: string, orgId: string): Promise<boolean> {
    const classes = await this.classRepository.findActiveClassesByEducator(educatorId, orgId)
    return classes.length > 0
  }

  async getEducatorClasses(educatorId: string, orgId: string) {
    return this.classRepository.findActiveClassesByEducator(educatorId, orgId)
  }

  async getStudentClasses(studentId: string, orgId: string) {
    const enrollments = await this.enrollmentService.getStudentEnrollments(studentId, orgId)
    return Promise.all(
      enrollments.map(async (enrollment) => {
        const cls = (enrollment as any).class
        const { subject, educatorProfile } = await this.classRepository.findSubjectWithEducator(cls.id)
        return {
          enrollmentId:     enrollment.id,
          enrollmentStatus: enrollment.status,
          class: {
            id:           cls.id,
            subjectId:    cls.subject_id,
            subjectName:  subject?.name ?? null,
            educatorId:   cls.educator_id,
            educatorName: educatorProfile?.full_name ?? null,
            sectionId:    cls.section_id,
            schoolYearId: cls.school_year_id,
            semesterId:   cls.semester_id,
            capacity:     cls.capacity,
            schedules:    cls.schedules,
          },
        }
      }),
    )
  }

  async getStudentClassById(classId: string, studentId: string, orgId: string) {
    const enrollment = await this.enrollmentService.getStudentEnrollmentForClass(classId, studentId, orgId)
    const cls        = (enrollment as any).class
    const { subject, educatorProfile } = await this.classRepository.findSubjectWithEducator(cls.id)
    return {
      enrollmentId:     enrollment.id,
      enrollmentStatus: enrollment.status,
      class: {
        id:           cls.id,
        subjectId:    cls.subject_id,
        subjectName:  subject?.name ?? null,
        educatorId:   cls.educator_id,
        educatorName: educatorProfile?.full_name ?? null,
        sectionId:    cls.section_id,
        schoolYearId: cls.school_year_id,
        semesterId:   cls.semester_id,
        capacity:     cls.capacity,
        schedules:    cls.schedules,
      },
    }
  }

  private parseSlots(schedules: ScheduleSlotDto[]): TimeSlot[] {
    return schedules.map((s) => {
      const start = parseTime(s.startTime)
      const end   = parseTime(s.endTime)
      if (start >= end) {
        throw new BadRequestException(
          `Schedule weekday ${s.weekday}: start time must be before end time.`,
        )
      }
      return { weekday: s.weekday, startTime: start, endTime: end }
    })
  }

  private async assertNoEducatorConflict(educatorId: string, orgId: string, newSlots: TimeSlot[], excludeClassId?: string) {
    const existing = await this.classRepository.findEducatorSchedules(educatorId, orgId)
    for (const existingSlot of existing) {
      if (excludeClassId && (existingSlot as any).class_id === excludeClassId) continue
      const slot: TimeSlot = {
        weekday:   existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime:   new Date(existingSlot.end_time),
      }
      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Educator already has a class on weekday ${slot.weekday} that overlaps with this time slot.`,
          )
        }
      }
    }
  }

  private async assertNoSectionConflict(sectionId: string, orgId: string, newSlots: TimeSlot[], excludeClassId?: string) {
    const existing = await this.classRepository.findSectionSchedules(sectionId, orgId)
    for (const existingSlot of existing) {
      if (excludeClassId && (existingSlot as any).class_id === excludeClassId) continue
      const slot: TimeSlot = {
        weekday:   existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime:   new Date(existingSlot.end_time),
      }
      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Section already has a class on weekday ${slot.weekday} that overlaps with this time slot.`,
          )
        }
      }
    }
  }
}