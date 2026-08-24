import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { ProgramShiftRepository } from './program-shift.repository';
import { ShiftProgramDto } from './dto/program-shift.dto';
import { SchoolYearReadinessService } from '../school-year/school-year-readiness.service';
import { SectionService } from '../section/section.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrgEnrollmentSettingService } from '../org-enrollment-setting/org-enrollment-setting.service';

@Injectable()
export class ProgramShiftService {
  constructor(
    private readonly db: DatabaseService,
    private readonly repo: ProgramShiftRepository,
    private readonly readinessService: SchoolYearReadinessService,
    private readonly sectionService: SectionService,
    private readonly auditLogService: AuditLogService,
    private readonly orgSettingService: OrgEnrollmentSettingService,
  ) {}

  async shiftProgram(
    orgId: string,
    studentSchoolYearId: string,
    actorId: string,
    dto: ShiftProgramDto,
  ) {
    const ssy = await this.repo.findStudentSchoolYearById(studentSchoolYearId, orgId);
    if (!ssy) throw new NotFoundException('Student school year enrollment not found.');

    await this.readinessService.assertReady(orgId, ssy.school_year_id);

    // Guard: no pending class assignment request (no requests during active shift)
    const pendingRequest = await this.db.classAssignmentRequest.findFirst({
      where: {
        student_school_year_id: studentSchoolYearId,
        org_id: orgId,
        status: 'pending_review',
      },
    });
    if (pendingRequest) {
      throw new ConflictException(
        'Resolve pending class assignment request before shifting program.',
      );
    }

    const activeEnrollment = await this.repo.findActiveProgramEnrollment(
      studentSchoolYearId,
      orgId,
    );
    if (!activeEnrollment) {
      throw new NotFoundException('No active program enrollment to shift from.');
    }

    // Same-department only, but allow same program with different strand/course/level
    const samePlacement =
      activeEnrollment.program_id === dto.toProgramId &&
      (activeEnrollment.course_id ?? null) === (dto.courseId ?? null) &&
      (activeEnrollment.strand_id ?? null) === (dto.strandId ?? null) &&
      (activeEnrollment.level_id ?? null) === dto.levelId;
    if (samePlacement) {
      throw new BadRequestException('Target placement is same as current — change at least level, course or strand.');
    }

    // Validate target program exists and belongs to same school year
    const targetProgram = await this.db.program.findFirst({
      where: { id: dto.toProgramId, org_id: orgId },
    });
    if (!targetProgram) throw new NotFoundException('Target program not found.');
    if (targetProgram.school_year_id !== ssy.school_year_id) {
      throw new BadRequestException(
        'Program shift must stay within same school year. Use enrollment flow for next year.',
      );
    }
    const currentProgram = await this.db.program.findFirst({
      where: { id: activeEnrollment.program_id, org_id: orgId },
    });
    if (currentProgram && targetProgram.type !== currentProgram.type) {
      throw new BadRequestException('Shifting across departments not allowed — use enrollment for different department.');
    }
    // Validate level exists (required)
    const targetLevel = await this.db.level.findFirst({
      where: { id: dto.levelId, org_id: orgId },
    });
    if (!targetLevel) throw new NotFoundException('Target level not found.');
    if (targetLevel.program_id !== dto.toProgramId) {
      // For college/shs, level may be tied to course/strand, but still under program
      if (dto.courseId && targetLevel.course_id !== dto.courseId) {
        throw new BadRequestException('Level does not belong to specified course.');
      }
      if (dto.strandId && targetLevel.strand_id !== dto.strandId) {
        throw new BadRequestException('Level does not belong to specified strand.');
      }
    }

    // Validate section/level/course/strand if provided
    if (dto.sectionId) {
      const section = await this.sectionService.findById(dto.sectionId, orgId);
      if (dto.levelId && section.level_id !== dto.levelId) {
        throw new BadRequestException('Section does not belong to specified level.');
      }
      if (dto.courseId && section.course_id !== dto.courseId) {
        throw new BadRequestException('Section does not belong to specified course.');
      }
      if (dto.strandId && section.strand_id !== dto.strandId) {
        throw new BadRequestException('Section does not belong to specified strand.');
      }
      const enrolled = await this.sectionService.countStudentsInSection(section.id);
      if (enrolled >= section.capacity) {
        throw new ConflictException(`Section "${section.name}" is full.`);
      }
    }

    const orgSetting = await this.orgSettingService.getByOrg(orgId);
    const defaultOutcome = (orgSetting as unknown as { default_shift_outcome?: string })?.default_shift_outcome ?? 'dropped';

    const overrideMap = new Map<string, { outcome: string; reason?: string }>();
    if (dto.perClassOutcomeOverrides) {
      for (const o of dto.perClassOutcomeOverrides) {
        overrideMap.set(o.enrollmentId, { outcome: o.outcome, reason: o.reason });
      }
    }

    const result = await this.db.$transaction(async (tx) => {
      // 1. End old program enrollment
      const ended = await tx.studentProgramEnrollment.update({
        where: { id: activeEnrollment.id },
        data: {
          status: 'ended',
          end_reason: 'shifted',
          ended_at: new Date(),
          ended_by: actorId,
        },
      });

      // 2. Create new program enrollment (level required, section optional default No section)
      const created = await tx.studentProgramEnrollment.create({
        data: {
          org_id: orgId,
          student_school_year_id: studentSchoolYearId,
          program_id: dto.toProgramId,
          level_id: dto.levelId,
          course_id: dto.courseId ?? null,
          strand_id: dto.strandId ?? null,
          section_id: dto.sectionId ?? null,
          status: 'active',
          section_assigned_at: dto.sectionId ? new Date() : null,
        },
        include: {
          program: true,
          level: true,
          course: true,
          strand: true,
          section: true,
        },
      });

      // 3. Create shift event
      const shiftEvent = await tx.programShiftEvent.create({
        data: {
          org_id: orgId,
          student_school_year_id: studentSchoolYearId,
          from_program_enrollment_id: activeEnrollment.id,
          to_program_enrollment_id: created.id,
          default_outcome_used: defaultOutcome as never,
          actor_id: actorId,
        },
      });

      // 4. Bulk update enrollments for old program
      const enrollmentsToUpdate = await this.repo.findEnrollmentsForOldProgramTx(
        tx,
        ssy.student_id,
        orgId,
        activeEnrollment.program_id,
      );

      let affectedCount = 0;
      for (const enrollment of enrollmentsToUpdate) {
        const override = overrideMap.get(enrollment.id);
        const outcome = (override?.outcome as never) ?? defaultOutcome;
        const reason = override?.reason ?? null;
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'removed',
            outcome: outcome as never,
            outcome_reason: reason,
            outcome_set_at: new Date(),
            outcome_set_by: actorId,
            shift_event_id: shiftEvent.id,
          },
        });
        affectedCount += 1;
      }

      return { ended, created, shiftEvent, affectedCount };
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'program_shift',
        entityType: 'program_enrollment',
        entityId: activeEnrollment.id,
        metadata: {
          fromProgramId: activeEnrollment.program_id,
          toProgramId: dto.toProgramId,
          affectedEnrollments: result.affectedCount,
          shiftEventId: result.shiftEvent.id,
        },
      })
      .catch(() => {});

    return result;
  }
}
