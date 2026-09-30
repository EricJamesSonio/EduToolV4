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
import { OrgScheduleConfigService } from '../org-schedule-config/org-schedule-config.service';
import { getScheduleViolation } from '../org-schedule-config/schedule-window.util';
import {
  resolveSubjectAcademicStructures,
  isEligibleForClassStructure,
} from '../enrollment/enrollment-eligibility.util';
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
  toTimeSlot,
  minuteSlotsOverlap,
  toMinuteSlot,
  type MinuteSlot,
} from './class-schedule.util';
import { SubjectPrerequisiteService } from '../subject-prerequisite/subject-prerequisite.service';

/** A parsed schedule slot. `roomId` rides along so a single pass can both
 *  persist the assignment and run the room conflict check. */
type TimeSlot = ReturnType<typeof toTimeSlot> & { roomId?: string | null };

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly attendanceService: AttendanceService,
    private readonly auditLogService: AuditLogService,
    private readonly gradingSchemeTemplateService: GradingSchemeTemplateService,
    private readonly subjectPrerequisiteService: SubjectPrerequisiteService,
    private readonly db: DatabaseService,
    private readonly orgScheduleConfigService: OrgScheduleConfigService,
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


  private dateToMinutes(d: Date): number {
    return d.getHours() * 60 + d.getMinutes();
  }

  /** A class always holds its whole section, so capacity = the section's capacity. */
  private async resolveSectionCapacity(
    sectionId: string,
    orgId: string,
  ): Promise<number> {
    const section = await this.db.section.findFirst({
      where: { id: sectionId, org_id: orgId, deleted_at: null },
      select: { capacity: true },
    });
    if (!section) throw new NotFoundException('Section not found.');
    return section.capacity;
  }

  private async assertScheduleConfig(orgId: string, slots: TimeSlot[]): Promise<void> {
    const cfg = await this.orgScheduleConfigService.getByOrg(orgId);
    for (const slot of slots) {
      // `weekday` is passed so the org's active-weekday rule is enforced too:
      // a class cannot land on a day the school does not hold classes.
      const violation = getScheduleViolation(
        cfg,
        this.dateToMinutes(slot.startTime),
        this.dateToMinutes(slot.endTime),
        slot.weekday,
      );
      if (violation) {
        throw new BadRequestException(
          `Schedule weekday ${slot.weekday}: ${violation}`,
        );
      }
    }
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
    await this.assertScheduleConfig(orgId, slots);
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
      await this.assertNoDuplicateSubjectInSection(
        orgId,
        dto.sectionId,
        dto.subjectId,
        semesterId,
      );
    }

    // No-ops when no slot has a room — rooms are optional.
    await this.assertRoomsFree(orgId, slots, dto.schoolYearId);

    // Class capacity is derived from its section. With no section it falls
    // back to 0, which the enrollment checks treat as "no cap".
    const capacity = dto.sectionId
      ? await this.resolveSectionCapacity(dto.sectionId, orgId)
      : 0;

    const cls = await this.classRepository.create({
      orgId,
      subjectId: dto.subjectId,
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      schoolYearId: dto.schoolYearId,
      semesterId,
      capacity,
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
      programId: query.programId,
      search: query.search,
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
          template_id: (cls as any).gradingSchemes?.[0]?.template_id ?? null,
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

  // NEW — for the Classes page Educator filter, scoped to the currently
  // selected Department/Semester instead of listing every educator in the org.
  async getDistinctEducators(
    orgId: string,
    query: { schoolYearId?: string; semesterId?: string; programId?: string },
  ) {
    return this.classRepository.findDistinctEducators(orgId, {
      schoolYearId: query.schoolYearId,
      semesterId: query.semesterId,
      programId: query.programId,
    });
  }

  async update(id: string, orgId: string, dto: UpdateClassDto) {
    const cls = await this.classRepository.findById(id, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const newEducatorId = dto.educatorId ?? cls.educator_id;
    const newSectionId = dto.sectionId ?? cls.section_id ?? undefined;

    // Determine which schedules to validate against
    if (dto.schedules) {
      const slots = this.parseSlots(dto.schedules);
      await this.assertScheduleConfig(orgId, slots);
      await this.assertNoEducatorConflict(
        newEducatorId,
        orgId,
        slots,
        cls.school_year_id,
        id,
      );

      // Moving a section re-checks that section's week even if its slots did
      // not change, since the class now competes for a different schedule.
      if (newSectionId) {
        await this.assertNoSectionConflict(
          newSectionId,
          orgId,
          slots,
          cls.school_year_id,
          id,
        );
      }

      if (dto.sectionId && dto.sectionId !== cls.section_id) {
        await this.assertNoDuplicateSubjectInSection(
          orgId,
          dto.sectionId,
          cls.subject_id,
          cls.semester_id,
          id,
        );
      }

      // Excludes this class so its own current slots don't self-conflict.
      await this.assertRoomsFree(orgId, slots, cls.school_year_id, id);

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

    // Moving the class to another section re-syncs its capacity.
    const capacity =
      dto.sectionId && dto.sectionId !== cls.section_id
        ? await this.resolveSectionCapacity(dto.sectionId, orgId)
        : undefined;

    return this.classRepository.update(id, {
      educatorId: dto.educatorId,
      sectionId: dto.sectionId,
      capacity,
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

  async getEligibleStudents(classId: string, orgId: string, search?: string) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    return this.classRepository.findEligibleStudents(classId, orgId, search);
  }

  async getEligibleClassesForStudent(
    studentId: string,
    orgId: string,
    search?: string,
  ) {
    // Validate student exists and belongs to org
    const student = await this.db.account.findFirst({
      where: { id: studentId, org_id: orgId, role: 'student' },
    });
    if (!student) throw new NotFoundException('Student not found.');

    // Build map of schoolYear -> active academic placement
    const ssyRows = await this.db.studentSchoolYear.findMany({
      where: { org_id: orgId, student_id: studentId },
      include: {
        programEnrollments: { where: { status: 'active' } },
      },
    });

    const placementByYear = new Map<
      string,
      { programId: string | null; levelId: string | null; courseId: string | null; strandId: string | null; sectionId: string | null }
    >();
    for (const row of ssyRows) {
      const pe = row.programEnrollments[0];
      if (!pe) continue;
      placementByYear.set(row.school_year_id, {
        programId: pe.program_id,
        levelId: pe.level_id,
        courseId: pe.course_id,
        strandId: pe.strand_id,
        sectionId: pe.section_id,
      });
    }

    if (placementByYear.size === 0) return [];

    // Already enrolled classes (to exclude) and subject+semester duplicates
    const existingEnrollments = await this.db.enrollment.findMany({
      where: { student_id: studentId, org_id: orgId, status: { not: 'removed' } },
      include: { class: { select: { subject_id: true, semester_id: true } } },
    });
    const enrolledClassIds = new Set(existingEnrollments.map((e) => e.class_id));
    const enrolledSubjectSemester = new Set(
      existingEnrollments.map((e) => `${e.class.subject_id}::${e.class.semester_id}`),
    );

    // Candidate classes — same org, not archived, capacity-aware but still shown if full
    const where: Record<string, unknown> = {
      org_id: orgId,
      deleted_at: null,
    };
    if (search) {
      (where as Record<string, unknown>).OR = [
        { subject: { name: { contains: search, mode: 'insensitive' as const } } },
        { educator: { profile: { full_name: { contains: search, mode: 'insensitive' as const } } } },
      ];
    }

    const candidates = await this.db.class.findMany({
      where: where as never,
      include: {
        _count: { select: { enrollments: { where: { status: 'active' } } } },
        schedules: true,
        subject: {
          select: {
            id: true,
            name: true,
            program_id: true,
            course_id: true,
            strand_id: true,
            level_id: true,
            program: { select: { name: true } },
            course: { select: { name: true } },
            strand: { select: { name: true } },
            level: { select: { name: true } },
          },
        },
        educator: { include: { profile: { select: { full_name: true } } } },
        schoolYear: { select: { id: true, name: true } },
        gradingSchemes: { where: { template_id: { not: null } }, take: 1, select: { template_id: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    const eligible: typeof candidates = [];
    // Perf Phase 5: resolve every candidate's academic structure with one
    // batched query instead of up to 6 sequential queries per class.
    const structuresBySubject = await resolveSubjectAcademicStructures(
      this.db,
      candidates.map((cls) => cls.subject_id),
      orgId,
    );
    for (const cls of candidates) {
      if (enrolledClassIds.has(cls.id)) continue;
      const dupKey = `${cls.subject_id}::${cls.semester_id}`;
      if (enrolledSubjectSemester.has(dupKey)) continue;

      const studentStructure = placementByYear.get(cls.school_year_id) ?? null;
      if (!studentStructure) continue;

      const subjectStructure = structuresBySubject.get(cls.subject_id) ?? {
        programId: null,
        courseIds: [],
        strandIds: [],
        levelIds: [],
      };
      if (!subjectStructure.programId) continue;

      const eligibleByStructure = isEligibleForClassStructure(
        subjectStructure,
        studentStructure as never,
        cls.section_id,
      );
      if (!eligibleByStructure) continue;

      eligible.push(cls);
    }

    // Map to same shape as findAll for frontend consumption, plus live prerequisite warnings (soft, never blocks)
    // Perf Phase 5: ONE batched eligibility check for all eligible subjects
    // with ONE shared scale cache — was one checkEligibility (2+P×2 queries)
    // per class.
    const eligibilityBySubject =
      await this.subjectPrerequisiteService.checkEligibilityBatch(
        eligible.map((cls) => cls.subject_id),
        studentId,
        orgId,
      );
    const withWarnings = eligible.map((cls) => {
        const eligibility = eligibilityBySubject.get(cls.subject_id) ?? {
          eligible: true,
          missing: [],
        };
        const subject = (cls as unknown as { subject: { name: string; program_id: string | null; program: { name: string } | null; course: { name: string } | null; strand: { name: string } | null; level: { name: string } | null } }).subject;
        const educator = (cls as unknown as { educator: { profile: { full_name: string } | null } }).educator;
        return {
          ...cls,
          program_id:
            (cls as unknown as { subject: { program_id: string | null } }).subject?.program_id ?? null,
          template_id: (cls as unknown as { gradingSchemes: { template_id: string }[] }).gradingSchemes?.[0]?.template_id ?? null,
          subject_name: subject?.name ?? null,
          program_name: subject?.program?.name ?? subject?.course?.name ?? subject?.strand?.name ?? null,
          level_name: subject?.level?.name ?? null,
          course_name: (cls as unknown as { subject: { course: { name: string } | null } }).subject?.course?.name ?? null,
          strand_name: (cls as unknown as { subject: { strand: { name: string } | null } }).subject?.strand?.name ?? null,
          educatorName: educator?.profile?.full_name ?? null,
          enrolled_count: (cls as unknown as { _count: { enrollments: number } })._count?.enrollments ?? 0,
          has_prerequisite_warning: eligibility.missing.length > 0,
          prerequisite_warnings: eligibility.missing,
        };
      },
    );
    return withWarnings;
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

  async getEducatorTeachingHistory(educatorId: string, orgId: string) {
    return this.classRepository.findTeachingHistoryByEducator(educatorId, orgId);
  }

  async getStudentClasses(studentId: string, orgId: string) {
    const enrollments = await this.enrollmentService.getStudentEnrollments(
      studentId,
      orgId,
    );
    // Perf Phase 3: one batched subject+educator lookup instead of one
    // findSubjectWithEducator per enrollment.
    const infoByClass =
      await this.classRepository.findSubjectsWithEducators(
        enrollments.map((enrollment) => (enrollment as any).class.id),
      );
    const countsByClass = await this.enrollmentService.countActiveMany(
      enrollments.map((enrollment) => (enrollment as any).class.id),
      orgId,
    );
    return enrollments.map((enrollment) => {
      const cls = (enrollment as any).class;
      const info = infoByClass.get(cls.id);
      const subject = info?.subject ?? null;
      const educatorProfile = info?.educatorProfile ?? null;
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
          enrolledCount: countsByClass.get(cls.id) ?? 0,
          schedules: cls.schedules,
        },
      };
    });
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
    const enrolledCount = await this.enrollmentService.countActive(cls.id);
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
        enrolledCount,
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
      return {
        weekday: s.weekday,
        startTime: start,
        endTime: end,
        roomId: s.roomId ?? null,
      };
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

    const taken: MinuteSlot[] = existing
      .filter((slot) => slot.class_id !== excludeClassId)
      .map((slot) =>
        toMinuteSlot(
          slot.weekday,
          new Date(slot.start_time),
          new Date(slot.end_time),
        ),
      );

    for (const newSlot of newSlots) {
      const asMinutes = toMinuteSlot(
        newSlot.weekday,
        newSlot.startTime,
        newSlot.endTime,
      );
      if (taken.some((e) => minuteSlotsOverlap(e, asMinutes))) {
        throw new ConflictException(
          `Educator already has a class on weekday ${newSlot.weekday} that overlaps with this time slot.`,
        );
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

    const taken: MinuteSlot[] = existing
      .filter((slot) => slot.class_id !== excludeClassId)
      .map((slot) =>
        toMinuteSlot(
          slot.weekday,
          new Date(slot.start_time),
          new Date(slot.end_time),
        ),
      );

    for (const newSlot of newSlots) {
      const asMinutes = toMinuteSlot(
        newSlot.weekday,
        newSlot.startTime,
        newSlot.endTime,
      );
      if (taken.some((e) => minuteSlotsOverlap(e, asMinutes))) {
        throw new ConflictException(
          `Section already has a class on weekday ${newSlot.weekday} that overlaps with this time slot.`,
        );
      }
    }
  }

  /**
   * Room availability check. Rooms are OPTIONAL, so a batch with no room on
   * any slot is valid and returns immediately — nothing to check.
   *
   * Scoped by org_id (tenant isolation) and by the class's school year, since
   * a room is only "booked" relative to the year the booking belongs to.
   * Archived classes are excluded: they are read-only and hidden from active
   * views, so they must never block a new assignment.
   */
  private async assertRoomsFree(
    orgId: string,
    newSlots: TimeSlot[],
    schoolYearId: string,
    excludeClassId?: string,
  ): Promise<void> {
    const withRoom = newSlots.filter((s) => !!s.roomId);
    if (withRoom.length === 0) return;

    const roomIds = [...new Set(withRoom.map((s) => s.roomId as string))];

    // A class cannot book the same room twice at overlapping times. The client
    // blocks this, but the endpoint is reachable directly, so enforce it here
    // too rather than trusting the form.
    for (let i = 0; i < withRoom.length; i++) {
      for (let j = i + 1; j < withRoom.length; j++) {
        const a = withRoom[i];
        const b = withRoom[j];
        if (a.roomId !== b.roomId) continue;
        if (
          minuteSlotsOverlap(
            toMinuteSlot(a.weekday, a.startTime, a.endTime),
            toMinuteSlot(b.weekday, b.startTime, b.endTime),
          )
        ) {
          throw new ConflictException(
            'Two of this class\'s slots use the same room at overlapping times.',
          );
        }
      }
    }

    // Verify every id actually belongs to this org before trusting it. Without
    // this, a crafted payload could probe another org's room ids.
    const owned = await this.db.room.findMany({
      where: { id: { in: roomIds }, org_id: orgId },
      select: { id: true },
    });
    if (owned.length !== roomIds.length) {
      throw new BadRequestException(
        'One or more selected rooms do not exist.',
      );
    }

    const existing = await this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        room_id: { in: roomIds },
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      include: { room: { select: { name: true } } },
    });

    for (const booked of existing) {
      if (excludeClassId && booked.class_id === excludeClassId) continue;

      const bookedMinutes = toMinuteSlot(
        booked.weekday,
        new Date(booked.start_time),
        new Date(booked.end_time),
      );

      for (const incoming of withRoom) {
        if (incoming.roomId !== booked.room_id) continue;
        if (
          minuteSlotsOverlap(
            bookedMinutes,
            toMinuteSlot(
              incoming.weekday,
              incoming.startTime,
              incoming.endTime,
            ),
          )
        ) {
          throw new ConflictException(
            `${booked.room?.name ?? 'That room'} is already booked on weekday ${booked.weekday} at an overlapping time.`,
          );
        }
      }
    }
  }

  private async assertNoDuplicateSubjectInSection(
    orgId: string,
    sectionId: string,
    subjectId: string,
    semesterId: string,
    excludeClassId?: string,
  ): Promise<void> {
    const existing = await this.classRepository.findSectionSubjectClass(
      orgId,
      sectionId,
      subjectId,
      semesterId,
      excludeClassId,
    );
    if (existing) {
      throw new ConflictException(
        'This section already has a class for this subject in this semester. Add another time slot to that class instead of creating a new one.',
      );
    }
  }
}