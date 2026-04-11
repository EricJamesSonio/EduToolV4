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

  private async resolveSemesterId(schoolYearId: string, orgId: string): Promise<string> {
    // Pick the first semester that belongs to this school year for this org.
    // Semester settings page is responsible for creating them — we just look one up.
    const semester = await this.db.semester.findFirst({
      where: { school_year_id: schoolYearId, org_id: orgId },
      orderBy: { start_date: 'asc' },
    })

    if (!semester) {
      throw new BadRequestException(
        'No semester found for this school year. Please set up semesters in Semester Settings before creating classes.',
      )
    }

    return semester.id
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(orgId: string, dto: CreateClassDto) {
    const semesterId = await this.resolveSemesterId(dto.schoolYearId, orgId)

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
      semesterId,               // resolved, not from client
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
    return this.classRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      semesterId:   query.semesterId,
      educatorId:   query.educatorId,
      subjectId:    query.subjectId,
      sectionId:    query.sectionId,
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
        const { subject, educatorProfile } = await this.classRepository.findSubjectWithEducator(
          cls.subject_id, cls.educator_id, orgId,
        )
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
    const { subject, educatorProfile } = await this.classRepository.findSubjectWithEducator(
      cls.subject_id, cls.educator_id, orgId,
    )
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