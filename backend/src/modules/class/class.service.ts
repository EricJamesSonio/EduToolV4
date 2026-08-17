// backend/src/modules/class/class.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ClassRepository } from './class.repository';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { AttendanceService } from '../attendance/attendance.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GradingSchemeTemplateService } from '../grading-scheme-template/grading-scheme-template.service';
import { resolveProgramIdFromSubject } from '../program/program-type-resolver';
import { DatabaseService } from '@/core/database/database.provider';
import {
  CreateClassDto,
  UpdateClassDto,
  QueryClassDto,
  EnrollStudentDto,
  UpdateEnrollmentDto,
  ReassignEducatorDto,
  ScheduleSlotDto,
} from './dto/class.dto';
import {
  parseTimeToDate,
  slotsOverlap,
  toTimeSlot,
} from './class-schedule.util';

type TimeSlot = ReturnType<typeof toTimeSlot>;

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly attendanceService: AttendanceService,
    private readonly auditLogService: AuditLogService,
    private readonly gradingSchemeTemplateService: GradingSchemeTemplateService,
    private readonly db: DatabaseService,
  ) {}

  // ---------------------------------------------------------------------------
  // Resolve semester automatically from schoolYearId
  // ---------------------------------------------------------------------------

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
    });

    if (!assignment) {
      throw new BadRequestException(
        'No semester template is assigned to this program. Please assign one in Semester Settings before creating classes.',
      );
    }

    const firstTemplateSemester = assignment.template.semesters[0];

    if (!firstTemplateSemester) {
      throw new BadRequestException(
        'The assigned semester template has no semesters defined.',
      );
    }

    // Try matching by name first
    const semester = await this.db.semester.findFirst({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        name: firstTemplateSemester.name,
      },
      orderBy: { start_date: 'asc' },
    });

    if (semester) return semester.id;

    // Fallback: any semester for this school year
    const fallback = await this.db.semester.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId },
      orderBy: { start_date: 'asc' },
    });

    if (!fallback) {
      throw new BadRequestException(
        'No semesters found for this school year. Please create semesters in Semester Settings first.',
      );
    }

    return fallback.id;
  }

  async create(orgId: string, dto: CreateClassDto, actorId: string) {
    const programId = await resolveProgramIdFromSubject(
      this.db,
      dto.subjectId,
      orgId,
    );

    if (!programId) {
      throw new BadRequestException(
        'Could not determine the program for this subject. Ensure the subject is properly linked.',
      );
    }

    const programType =
      (
        await this.db.program.findFirst({
          where: { id: programId, org_id: orgId },
          select: { type: true },
        })
      )?.type ?? '';

    const semesterId =
      dto.semesterId ??
      (await this.resolveSemesterId(dto.schoolYearId, programId, orgId));

    const slots = this.parseSlots(dto.schedules);
    await this.assertNoEducatorConflict(
      dto.educatorId,
      orgId,
      slots,
      dto.schoolYearId,
    );

    if (dto.sectionId) {
      await this.assertNoSectionConflict(
        dto.sectionId,
        orgId,
        slots,
        dto.schoolYearId,
      );
    }

    const cls = await this.classRepository.create({
      orgId,
      subjectId: dto.subjectId,
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      schoolYearId: dto.schoolYearId,
      semesterId,
      capacity: dto.capacity,
    });

    await this.classRepository.replaceSchedules(orgId, cls.id, slots);

    // Auto-apply: if a grading-scheme template is in effect for the class's
    // program, stamp it onto the newly created class so it is inherited
    // immediately. Never blocks class creation on failure.
    try {
      await this.gradingSchemeTemplateService.autoApplyForNewClass(
        orgId,
        cls.id,
        programId,
        dto.schoolYearId,
        programType,
      );
    } catch (err) {
      console.error(
        `[ClassService] Failed to auto-apply grading scheme template for class ${cls.id}:`,
        err,
      );
    }

    this.attendanceService
      .generateSessionsForClass(cls.id, orgId)
      .catch((err) => {
        console.error(
          `[AttendanceService] Failed to generate sessions for class ${cls.id}:`,
          err,
        );
      });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_created',
        entityType: 'class',
        entityId: cls.id,
        metadata: { subjectId: dto.subjectId, educatorId: dto.educatorId },
      })
      .catch(() => {});

    return this.classRepository.findById(cls.id, orgId);
  }

  // --- everything below is unchanged from your original ---

  async findAll(orgId: string, query: QueryClassDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.classRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      semesterId: query.semesterId,
      educatorId: query.educatorId,
      subjectId: query.subjectId,
      sectionId: query.sectionId,
      page,
      limit,
    });

    return {
      data: data.map((cls) => {
        const subject = (cls as any).subject;
        const educator = (cls as any).educator;

        const programId =
          subject?.program_id ??
          subject?.course?.program_id ??
          subject?.strand?.program_id ??
          null;

        return {
          ...cls,
          program_id: programId,
          template_id:
            (cls as any).gradingSchemes?.[0]?.template_id ?? null,
          subject_name: subject?.name ?? null,
          program_name:
            subject?.program?.name ??
            subject?.course?.program?.name ??
            subject?.strand?.program?.name ??
            null,
          level_name: subject?.level?.name ?? null,
          course_name: subject?.course?.name ?? null,
          strand_name: subject?.strand?.name ?? null,

          // ✅ THIS IS THE FIX
          educatorName: educator?.profile?.full_name ?? null,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  async update(id: string, orgId: string, dto: UpdateClassDto) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const newEducatorId = dto.educatorId ?? cls.educator_id;
    const newSectionId = dto.sectionId ?? cls.section_id ?? undefined;

    // Determine which schedules to validate against
    if (dto.schedules) {
      const slots = this.parseSlots(dto.schedules);
      await this.assertNoEducatorConflict(
        newEducatorId,
        orgId,
        slots,
        cls.school_year_id,
        id,
      );
      if (newSectionId)
        await this.assertNoSectionConflict(
          newSectionId,
          orgId,
          slots,
          cls.school_year_id,
          id,
        );
      await this.classRepository.replaceSchedules(orgId, id, slots);
    } else if (dto.educatorId && dto.educatorId !== cls.educator_id) {
      // Educator changed without schedule change — validate against existing schedules
      const schedules = await this.classRepository.findSchedulesByClass(id);
      const slots: TimeSlot[] = schedules.map((s) =>
        toTimeSlot({
          weekday: s.weekday,
          startTime: new Date(s.start_time),
          endTime: new Date(s.end_time),
        }),
      );
      await this.assertNoEducatorConflict(
        newEducatorId,
        orgId,
        slots,
        cls.school_year_id,
        id,
      );
    }

    return this.classRepository.update(id, {
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      capacity: dto.capacity,
    });
  }

  async archive(id: string, orgId: string, actorId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    await this.classRepository.softDelete(id);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_archived',
        entityType: 'class',
        entityId: id,
      })
      .catch(() => {});
  }

  async enrollStudent(
    id: string,
    orgId: string,
    dto: EnrollStudentDto,
    actorId: string,
  ) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const result = await this.enrollmentService.enroll(
      id,
      cls.subject_id,
      cls.semester_id,
      cls.capacity,
      dto.studentId,
      orgId,
    );

    if (!('overflow' in result)) {
      const activeCount = await this.enrollmentService.countActive(id);
      if (activeCount === 1) {
        await this.classRepository.lockGradingSchemeForClass(id, orgId);
      }
    }

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'enrollment_created',
        entityType: 'class_enrollment',
        entityId: id,
        metadata: { studentId: dto.studentId },
      })
      .catch(() => {});

    return result;
  }

  async getEnrolledStudents(classId: string, orgId: string) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.findEnrolledStudents(classId, orgId);
  }

  async getEligibleStudents(
    classId: string,
    orgId: string,
    search?: string,
  ) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.findEligibleStudents(classId, orgId, search);
  }

  async getEnrollments(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.enrollmentService.findByClass(id, orgId);
  }

  async updateEnrollment(
    classId: string,
    enrollmentId: string,
    orgId: string,
    dto: UpdateEnrollmentDto,
  ) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.enrollmentService.updateStatus(
      classId,
      enrollmentId,
      orgId,
      dto,
    );
  }

  async removeEnrollment(
    classId: string,
    enrollmentId: string,
    orgId: string,
    actorId: string,
  ) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    const result = await this.enrollmentService.remove(
      classId,
      enrollmentId,
      orgId,
    );

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'enrollment_removed',
        entityType: 'class_enrollment',
        entityId: classId,
        metadata: { enrollmentId },
      })
      .catch(() => {});

    return result;
  }

  async reassignEducator(
    id: string,
    orgId: string,
    dto: ReassignEducatorDto,
    adminId: string,
  ) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    if (cls.educator_id === dto.educatorId) {
      throw new BadRequestException(
        'The class is already assigned to this educator.',
      );
    }

    const existingSchedules = cls.schedules as any[];
    const slots: TimeSlot[] = existingSchedules.map((s) =>
      toTimeSlot({
        weekday: s.weekday,
        startTime: new Date(s.start_time),
        endTime: new Date(s.end_time),
      }),
    );

    await this.assertNoEducatorConflict(
      dto.educatorId,
      orgId,
      slots,
      cls.school_year_id,
      id,
    );
    await this.classRepository.createOwnershipLog({
      orgId,
      classId: id,
      fromEducatorId: cls.educator_id,
      toEducatorId: dto.educatorId,
      reason: dto.reason,
      reassignedBy: adminId,
    });

    const updated = await this.classRepository.update(id, {
      educatorId: dto.educatorId,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId: adminId,
        action: 'class_reassigned',
        entityType: 'class',
        entityId: id,
        metadata: {
          fromEducatorId: cls.educator_id,
          toEducatorId: dto.educatorId,
          reason: dto.reason,
        },
      })
      .catch(() => {});

    return updated;
  }

  async getOwnershipHistory(id: string, orgId: string) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.findOwnershipHistory(id, orgId);
  }

  async hasActiveClasses(educatorId: string, orgId: string): Promise<boolean> {
    const classes = await this.classRepository.findActiveClassesByEducator(
      educatorId,
      orgId,
    );
    return classes.length > 0;
  }

  async getEducatorClassCounts(
    orgId: string,
    educatorIds: string[],
  ): Promise<Map<string, number>> {
    return this.classRepository.countAssignedClasses(orgId, educatorIds);
  }

  async getEducatorClasses(educatorId: string, orgId: string) {
    return this.classRepository.findActiveClassesByEducator(educatorId, orgId);
  }

  async getStudentClasses(studentId: string, orgId: string) {
    const enrollments = await this.enrollmentService.getStudentEnrollments(
      studentId,
      orgId,
    );
    return Promise.all(
      enrollments.map(async (enrollment) => {
        const cls = (enrollment as any).class;
        const { subject, educatorProfile } =
          await this.classRepository.findSubjectWithEducator(cls.id);
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
  }

  async getStudentClassById(classId: string, studentId: string, orgId: string) {
    const enrollment =
      await this.enrollmentService.getStudentEnrollmentForClass(
        classId,
        studentId,
        orgId,
      );
    const cls = (enrollment as any).class;
    const { subject, educatorProfile } =
      await this.classRepository.findSubjectWithEducator(cls.id);
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

  private parseSlots(schedules: ScheduleSlotDto[]): TimeSlot[] {
    return schedules.map((s) => {
      const start = parseTimeToDate(s.startTime);
      const end = parseTimeToDate(s.endTime);
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
    schoolYearId: string,
    excludeClassId?: string,
  ) {
    const existing = await this.classRepository.findEducatorSchedules(
      educatorId,
      orgId,
      schoolYearId,
    );
    for (const existingSlot of existing) {
      if (excludeClassId && (existingSlot as any).class_id === excludeClassId)
        continue;
      const slot = toTimeSlot({
        weekday: existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime: new Date(existingSlot.end_time),
      });
      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Educator already has a class on weekday ${slot.weekday} that overlaps with this time slot.`,
          );
        }
      }
    }
  }

  private async assertNoSectionConflict(
    sectionId: string,
    orgId: string,
    newSlots: TimeSlot[],
    schoolYearId: string,
    excludeClassId?: string,
  ) {
    const existing = await this.classRepository.findSectionSchedules(
      sectionId,
      orgId,
      schoolYearId,
    );
    for (const existingSlot of existing) {
      if (excludeClassId && (existingSlot as any).class_id === excludeClassId)
        continue;
      const slot = toTimeSlot({
        weekday: existingSlot.weekday,
        startTime: new Date(existingSlot.start_time),
        endTime: new Date(existingSlot.end_time),
      });
      for (const newSlot of newSlots) {
        if (slotsOverlap(slot, newSlot)) {
          throw new ConflictException(
            `Section already has a class on weekday ${slot.weekday} that overlaps with this time slot.`,
          );
        }
      }
    }
  }
}
