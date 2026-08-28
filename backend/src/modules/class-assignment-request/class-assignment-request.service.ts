import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { ClassAssignmentRequestRepository } from './class-assignment-request.repository';
import {
  CreateClassAssignmentRequestDto,
  FinalizeClassAssignmentRequestDto,
  ReopenClassAssignmentRequestDto,
} from './dto/class-assignment-request.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SubjectPrerequisiteService } from '../subject-prerequisite/subject-prerequisite.service';

@Injectable()
export class ClassAssignmentRequestService {
  constructor(
    private readonly repo: ClassAssignmentRequestRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
    private readonly subjectPrerequisiteService: SubjectPrerequisiteService,
  ) {}

  async create(orgId: string, actorId: string, dto: CreateClassAssignmentRequestDto) {
    const ssy = await this.db.studentSchoolYear.findFirst({
      where: { id: dto.studentSchoolYearId, org_id: orgId },
    });
    if (!ssy) throw new NotFoundException('Student school year not found.');

    // Must be enrolled (active or pending) not unenrolled
    if (ssy.status === 'unenrolled') {
      throw new BadRequestException('Student is not enrolled in this school year.');
    }

    // No pending request already
    const existing = await this.repo.findPendingByStudentSchoolYear(
      dto.studentSchoolYearId,
      orgId,
    );
    if (existing) {
      throw new ConflictException('A pending request already exists for this student.');
    }

    // Validate subject ids exist (optional for admin_flag)
    const requestedIds = dto.studentRequestedSubjectIds ?? [];
    if (requestedIds.length > 0) {
      const subjects = await this.db.subject.findMany({
        where: { id: { in: requestedIds }, org_id: orgId },
        select: { id: true },
      });
      if (subjects.length !== requestedIds.length) {
        throw new BadRequestException('One or more requested subjects not found.');
      }
    }

    // Compute frozen prerequisite warnings (soft warning, never blocks)
    // Freeze the *outcome* (which prereqs were unmet) at submission time so later grade
    // corrections do not retroactively alter the audit trail (immediate-only, AND semantics via checkEligibility)
    const warnings: Array<{
      subject_id: string;
      subject_name: string;
      prerequisite_subject_id: string;
      prerequisite_subject_name: string;
      reason: string;
    }> = [];
    if (requestedIds.length > 0) {
      const requestedSubjects = await this.db.subject.findMany({
        where: { id: { in: requestedIds }, org_id: orgId },
        select: { id: true, name: true },
      });
      const nameMap = new Map(requestedSubjects.map((s) => [s.id, s.name]));
      for (const subjectId of requestedIds) {
        const eligibility =
          await this.subjectPrerequisiteService.checkEligibility(
            subjectId,
            ssy.student_id,
            orgId,
          );
        for (const missing of eligibility.missing) {
          warnings.push({
            subject_id: subjectId,
            subject_name: nameMap.get(subjectId) ?? subjectId,
            prerequisite_subject_id: missing.subject_id,
            prerequisite_subject_name: missing.subject_name,
            reason: missing.reason,
          });
        }
      }
    }
    const hasWarning = warnings.length > 0;

    const record = await this.repo.create({
      org_id: orgId,
      student_id: ssy.student_id,
      student_school_year_id: ssy.id,
      program_enrollment_id: dto.programEnrollmentId ?? null,
      origin: dto.origin as never,
      status: 'pending_review',
      student_requested_subject_ids: requestedIds,
      admin_finalized_subject_ids: dto.adminFinalizedSubjectIds ?? [],
      has_prerequisite_warning: hasWarning,
      prerequisite_warnings: warnings as unknown as never,
    } as never);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_assignment_request_created',
        entityType: 'class_assignment_request',
        entityId: record.id,
        metadata: { origin: dto.origin, studentId: ssy.student_id },
      })
      .catch(() => {});

    return record;
  }

  async finalize(
    id: string,
    orgId: string,
    actorId: string,
    dto: FinalizeClassAssignmentRequestDto,
  ) {
    const record = await this.repo.findById(id, orgId);
    if (!record) throw new NotFoundException('Request not found.');
    if (record.status !== 'pending_review') {
      throw new BadRequestException('Request is not pending review.');
    }

    // Validate finalized subject ids
    if (dto.adminFinalizedSubjectIds.length > 0) {
      const subjects = await this.db.subject.findMany({
        where: { id: { in: dto.adminFinalizedSubjectIds }, org_id: orgId },
        select: { id: true },
      });
      if (subjects.length !== dto.adminFinalizedSubjectIds.length) {
        throw new BadRequestException('One or more finalized subjects not found.');
      }
    }

    const updated = await this.repo.finalize(id, dto.adminFinalizedSubjectIds, actorId);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_assignment_request_finalized',
        entityType: 'class_assignment_request',
        entityId: id,
        metadata: { finalizedCount: dto.adminFinalizedSubjectIds.length },
      })
      .catch(() => {});

    return updated;
  }

  async reopen(id: string, orgId: string, actorId: string, dto: ReopenClassAssignmentRequestDto) {
    const record = await this.repo.findById(id, orgId);
    if (!record) throw new NotFoundException('Request not found.');
    if (record.status !== 'ready') {
      throw new BadRequestException('Request is not in ready state to reopen.');
    }

    const updated = await this.repo.reopen(id, dto.reason);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_assignment_request_reopened',
        entityType: 'class_assignment_request',
        entityId: id,
        metadata: { reason: dto.reason ?? null },
      })
      .catch(() => {});

    return updated;
  }

  async list(
    orgId: string,
    filters: {
      studentId?: string;
      schoolYearId?: string;
      status?: string;
      hasPrerequisiteWarning?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {};
    if (filters.studentId) where.student_id = filters.studentId;
    if (filters.schoolYearId) where.student_school_year_id = filters.schoolYearId;
    if (filters.status) where.status = filters.status;
    if (filters.hasPrerequisiteWarning !== undefined) {
      const v = String(filters.hasPrerequisiteWarning).toLowerCase();
      if (v === 'true' || v === '1') where.has_prerequisite_warning = true;
      else if (v === 'false' || v === '0') where.has_prerequisite_warning = false;
    }
    const [data, total] = await this.repo.findMany(orgId, where as never, page, limit);
    return { data, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const record = await this.repo.findById(id, orgId);
    if (!record) throw new NotFoundException('Request not found.');
    return record;
  }

  // Helper for batch enrollment to exclude pending students
  async getPendingStudentIds(orgId: string, schoolYearId: string): Promise<string[]> {
    const rows = await this.repo.findPendingStudentIds(orgId, schoolYearId);
    return rows.map((r) => r.student_id);
  }
}
