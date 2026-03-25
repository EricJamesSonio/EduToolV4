// @/modules/class/class.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ClassRepository } from './class.repository';
import { AttendanceService } from '../attendance/attendance.service';
import {
  CreateClassDto,
  UpdateClassDto,
  QueryClassDto,
  EnrollStudentDto,
  UpdateEnrollmentDto,
  ReassignEducatorDto,
  ScheduleSlotDto,
} from './dto/class.dto';

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTime(hhmm: string, referenceDate = new Date()): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

interface TimeSlot {
  weekday: number;
  startTime: Date;
  endTime: Date;
}

function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  if (a.weekday !== b.weekday) return false;
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ── POST /classes ────────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateClassDto) {
    const slots = this.parseSlots(dto.schedules);

    await this.assertNoEducatorConflict(dto.educatorId, orgId, slots);

    if (dto.sectionId) {
      await this.assertNoSectionConflict(dto.sectionId, orgId, slots);
    }

    const cls = await this.classRepository.create({
      orgId,
      subjectId: dto.subjectId,
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      schoolYearId: dto.schoolYearId,
      semesterId: dto.semesterId,
      capacity: dto.capacity,
    });

    await this.classRepository.replaceSchedules(orgId, cls.id, slots);

    // Auto-generate attendance sessions from class schedules + semester dates.
    // Fire-and-forget — does not block the response.
    this.attendanceService
      .generateSessionsForClass(cls.id, orgId)
      .catch((err) => {
        console.error(
          `[AttendanceService] Failed to generate sessions for class ${cls.id}:`,
          err,
        );
      });

    return this.classRepository.findById(cls.id, orgId);
  }

  // ── GET /classes ─────────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryClassDto) {
    return this.classRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      semesterId: query.semesterId,
      educatorId: query.educatorId,
      subjectId: query.subjectId,
      sectionId: query.sectionId,
    });
  }

  // ── GET /classes/:id ─────────────────────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  // ── PATCH /classes/:id ───────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateClassDto) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (dto.schedules) {
      const slots = this.parseSlots(dto.schedules);
      const educatorId = dto.educatorId ?? cls.educator_id;
      const sectionId = dto.sectionId ?? cls.section_id ?? undefined;

      await this.assertNoEducatorConflict(educatorId, orgId, slots, id);

      if (sectionId) {
        await this.assertNoSectionConflict(sectionId, orgId, slots, id);
      }

      await this.classRepository.replaceSchedules(orgId, id, slots);
    }

    return this.classRepository.update(id, {
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      capacity: dto.capacity,
    });
  }

  // ── DELETE /classes/:id (archive) ────────────────────────────────────────────

  async archive(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.softDelete(id);
  }

  // ── POST /classes/:id/enroll ─────────────────────────────────────────────────

  async enrollStudent(id: string, orgId: string, dto: EnrollStudentDto) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const duplicate = await this.classRepository.findDuplicateEnrollment(
      dto.studentId,
      cls.subject_id,
      cls.semester_id,
      orgId,
    );

    if (duplicate) {
      throw new ConflictException(
        'Student is already enrolled in a class for this subject in the same semester.',
      );
    }

    const existing = await this.classRepository.findEnrollmentByStudent(
      id,
      dto.studentId,
      orgId,
    );

    if (existing && existing.status !== 'removed') {
      throw new ConflictException('Student is already enrolled in this class.');
    }

    if (cls.capacity > 0) {
      const activeCount = await this.classRepository.countActiveEnrollments(id);

      if (activeCount >= cls.capacity) {
        return {
          overflow: true,
          message: `Class is at full capacity (${cls.capacity} students). Add a new parallel session or mark the student as pending enrollment.`,
          classId: id,
          studentId: dto.studentId,
        };
      }
    }

    return this.classRepository.createEnrollment({
      orgId,
      classId: id,
      studentId: dto.studentId,
      status: 'active',
    });
  }

  // ── GET /classes/:id/enrollments ─────────────────────────────────────────────

  async getEnrollments(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.findEnrollments(id, orgId);
  }

  // ── PATCH /classes/:classId/enrollments/:enrollmentId ────────────────────────

  async updateEnrollment(
    classId: string,
    enrollmentId: string,
    orgId: string,
    dto: UpdateEnrollmentDto,
  ) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const enrollment = await this.classRepository.findEnrollmentById(
      enrollmentId,
      orgId,
    );

    if (!enrollment || enrollment.class_id !== classId) {
      throw new NotFoundException('Enrollment not found.');
    }

    return this.classRepository.updateEnrollmentStatus(enrollmentId, dto.status);
  }

  // ── POST /classes/:id/reassign-educator ──────────────────────────────────────

  async reassignEducator(id: string, orgId: string, dto: ReassignEducatorDto) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (cls.educator_id === dto.educatorId) {
      throw new BadRequestException(
        'The class is already assigned to this educator.',
      );
    }

    const existingSchedules = cls.schedules as any[];
    const slots: TimeSlot[] = existingSchedules.map((s) => ({
      weekday: s.weekday,
      startTime: new Date(s.start_time),
      endTime: new Date(s.end_time),
    }));

    await this.assertNoEducatorConflict(dto.educatorId, orgId, slots, id);

    return this.classRepository.update(id, { educatorId: dto.educatorId });
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  async hasActiveClasses(educatorId: string, orgId: string): Promise<boolean> {
    const classes = await this.classRepository.findActiveClassesByEducator(
      educatorId,
      orgId,
    );
    return classes.length > 0;
  }

  // ── GET /student/classes ─────────────────────────────────────────────────────

  async getStudentClasses(studentId: string, orgId: string) {
    const enrollments = await this.classRepository.findEnrolledClassesByStudent(
      studentId,
      orgId,
    );

    // Enrich each enrollment with subject + educator name
    const results = await Promise.all(
      enrollments.map(async (enrollment) => {
        const cls = enrollment.class;
        const { subject, educatorProfile } =
          await this.classRepository.findSubjectWithEducator(
            cls.subject_id,
            cls.educator_id,
            orgId,
          );

        return {
          enrollmentId: enrollment.id,
          enrollmentStatus: enrollment.status,
          class: {
            id: cls.id,
            subjectId: cls.subject_id,
            subjectName: subject?.name ?? null,
            educatorId: cls.educator_id,
            educatorName: educatorProfile?.full_name ?? null,
            sectionId: cls.section_id,
            schoolYearId: cls.school_year_id,
            semesterId: cls.semester_id,
            capacity: cls.capacity,
            schedules: cls.schedules,
          },
        };
      }),
    );

    return results;
  }

  // ── GET /student/classes/:classId ────────────────────────────────────────────

  async getStudentClassById(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.classRepository.findEnrolledClassByStudent(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class.');
    }

    const cls = enrollment.class;
    const { subject, educatorProfile } =
      await this.classRepository.findSubjectWithEducator(
        cls.subject_id,
        cls.educator_id,
        orgId,
      );

    return {
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      class: {
        id: cls.id,
        subjectId: cls.subject_id,
        subjectName: subject?.name ?? null,
        educatorId: cls.educator_id,
        educatorName: educatorProfile?.full_name ?? null,
        sectionId: cls.section_id,
        schoolYearId: cls.school_year_id,
        semesterId: cls.semester_id,
        capacity: cls.capacity,
        schedules: cls.schedules,
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private parseSlots(schedules: ScheduleSlotDto[]): TimeSlot[] {
    return schedules.map((s) => {
      const start = parseTime(s.startTime);
      const end = parseTime(s.endTime);

      if (start >= end) {
        throw new BadRequestException(
          `Schedule weekday ${s.weekday}: start time must be before end time.`,
        );
      }

      return { weekday: s.weekday, startTime: start, endTime: end };
    });
  }

  private async assertNoEducatorConflict(
    educatorId: string,
    orgId: string,
    newSlots: TimeSlot[],
    excludeClassId?: string,
  ) {
    const existing = await this.classRepository.findEducatorSchedules(
      educatorId,
      orgId,
    );

    for (const existingSlot of existing) {
      if (excludeClassId && existingSlot.class_id === excludeClassId) continue;

      const slot: TimeSlot = {
        weekday: existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime: new Date(existingSlot.end_time),
      };

      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Educator already has a class scheduled on weekday ${slot.weekday} that overlaps with this time slot.`,
          );
        }
      }
    }
  }

  private async assertNoSectionConflict(
    sectionId: string,
    orgId: string,
    newSlots: TimeSlot[],
    excludeClassId?: string,
  ) {
    const existing = await this.classRepository.findSectionSchedules(
      sectionId,
      orgId,
    );

    for (const existingSlot of existing) {
      if (excludeClassId && existingSlot.class_id === excludeClassId) continue;

      const slot: TimeSlot = {
        weekday: existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime: new Date(existingSlot.end_time),
      };

      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Section already has a class scheduled on weekday ${slot.weekday} that overlaps with this time slot.`,
          );
        }
      }
    }
  }
}