import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { ClassAssignmentRequestRepository } from './class-assignment-request.repository';
import {
  CreateClassAssignmentRequestDto,
  FinalizeClassAssignmentRequestDto,
  ReopenClassAssignmentRequestDto,
} from './dto/class-assignment-request.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { SubjectPrerequisiteService } from '../subject-prerequisite/subject-prerequisite.service';
import { parseLevelRank } from '../subject-prerequisite/subject-prerequisite.utils';
import { resolveSubjectAcademicStructures } from '../enrollment/enrollment-eligibility.util';
import {
  findClassConflicts,
  slotFromRow,
  type BlockedClassView,
  type ClassView,
  type LatestRequestView,
  type RequestableClassView,
  type RequestDecision,
  type StudentClassAvailability,
} from './class-request.util';

export interface RequestActor {
  id: string;
  role: string;
}

const CLASS_INCLUDE = {
  schedules: true,
  subject: { select: { id: true, name: true } },
  educator: { select: { profile: { select: { full_name: true } } } },
} satisfies Prisma.ClassInclude;

type ClassRow = Prisma.ClassGetPayload<{ include: typeof CLASS_INCLUDE }>;
type RequestRow = NonNullable<
  Awaited<ReturnType<ClassAssignmentRequestRepository['findById']>>
>;

const unique = <T>(list: T[]): T[] => [...new Set(list)];

@Injectable()
export class ClassAssignmentRequestService {
  constructor(
    private readonly repo: ClassAssignmentRequestRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
    private readonly subjectPrerequisiteService: SubjectPrerequisiteService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Class views ───────────────────────────────────────────────────────────

  private async buildViews(
    orgId: string,
    rows: ClassRow[],
  ): Promise<Map<string, ClassView>> {
    const views = new Map<string, ClassView>();
    if (rows.length === 0) return views;

    const sectionIds = unique(
      rows.map((r) => r.section_id).filter((v): v is string => !!v),
    );
    const semesterIds = unique(rows.map((r) => r.semester_id));
    const classIds = rows.map((r) => r.id);

    const [sections, semesters, counts] = await Promise.all([
      this.db.section.findMany({
        where: { id: { in: sectionIds }, org_id: orgId },
        select: { id: true, name: true, level: { select: { name: true } } },
      }),
      this.db.semester.findMany({
        where: { id: { in: semesterIds }, org_id: orgId },
        select: { id: true, name: true },
      }),
      this.db.enrollment.groupBy({
        by: ['class_id'],
        where: { org_id: orgId, class_id: { in: classIds }, status: 'active' },
        _count: { _all: true },
      }),
    ]);

    const sectionById = new Map(sections.map((s) => [s.id, s]));
    const semesterById = new Map(semesters.map((s) => [s.id, s]));
    const countByClass = new Map(counts.map((c) => [c.class_id, c._count._all]));

    for (const row of rows) {
      const section = row.section_id ? sectionById.get(row.section_id) : null;
      views.set(row.id, {
        classId: row.id,
        subjectId: row.subject_id,
        subjectName: row.subject?.name ?? 'Unnamed subject',
        semesterId: row.semester_id,
        semesterName: semesterById.get(row.semester_id)?.name ?? null,
        sectionId: row.section_id,
        sectionName: section?.name ?? null,
        levelName: section?.level?.name ?? null,
        educatorName: row.educator?.profile?.full_name ?? null,
        capacity: row.capacity,
        enrolledCount: countByClass.get(row.id) ?? 0,
        schedules: row.schedules.map(slotFromRow),
      });
    }
    return views;
  }

  private async loadClassViews(
    orgId: string,
    classIds: string[],
  ): Promise<Map<string, ClassView>> {
    const ids = unique(classIds);
    if (ids.length === 0) return new Map();
    const rows = await this.db.class.findMany({
      where: { id: { in: ids }, org_id: orgId },
      include: CLASS_INCLUDE,
    });
    return this.buildViews(orgId, rows);
  }

  // ── Student availability ──────────────────────────────────────────────────

  async getAvailability(
    studentId: string,
    orgId: string,
  ): Promise<StudentClassAvailability> {
    const empty: StudentClassAvailability = {
      placement: null,
      semesters: [],
      classes: [],
      blocked: [],
      enrolled: [],
      latestRequest: null,
    };

    const ssy = await this.db.studentSchoolYear.findFirst({
      where: {
        org_id: orgId,
        student_id: studentId,
        status: { not: 'unenrolled' },
        schoolYear: { status: 'active' },
      },
      orderBy: { enrolled_at: 'desc' },
      include: {
        schoolYear: { select: { id: true, name: true } },
        programEnrollments: {
          where: { status: 'active' },
          orderBy: { enrolled_at: 'desc' },
          take: 1,
          include: {
            program: { select: { name: true } },
            level: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
      },
    });

    const pe = ssy?.programEnrollments[0];
    if (!ssy || !pe) return empty;

    const schoolYearId = ssy.school_year_id;
    const studentRank = parseLevelRank(pe.level?.name ?? null);
    const isIrregular = !pe.is_regular;

    const [rows, semesters, myEnrollments, completed, latest] =
      await Promise.all([
        this.db.class.findMany({
          where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
          include: CLASS_INCLUDE,
        }),
        this.db.semester.findMany({
          where: { org_id: orgId, school_year_id: schoolYearId },
          orderBy: { start_date: 'asc' },
          select: {
            id: true,
            name: true,
            program_id: true,
            start_date: true,
            end_date: true,
          },
        }),
        this.db.enrollment.findMany({
          where: {
            org_id: orgId,
            student_id: studentId,
            status: { not: 'removed' },
            class: { school_year_id: schoolYearId, deleted_at: null },
          },
          select: {
            class_id: true,
            class: { select: { subject_id: true } },
          },
        }),
        this.subjectPrerequisiteService.getCompletedSubjectIds(studentId, orgId),
        this.db.classAssignmentRequest.findFirst({
          where: {
            org_id: orgId,
            student_id: studentId,
            student_school_year_id: ssy.id,
          },
          orderBy: { created_at: 'desc' },
        }),
      ]);

    const views = await this.buildViews(orgId, rows);
    const structures = await resolveSubjectAcademicStructures(
      this.db,
      rows.map((r) => r.subject_id),
      orgId,
    );

    const enrolledClassIds = new Set(myEnrollments.map((e) => e.class_id));
    const enrolledSubjectIds = new Set(
      myEnrollments.map((e) => e.class.subject_id),
    );

    const candidates: Array<{ row: ClassRow; scope: 'current' | 'lower' }> = [];
    for (const row of rows) {
      if (enrolledClassIds.has(row.id)) continue;
      if (enrolledSubjectIds.has(row.subject_id) || completed.has(row.subject_id)) {
        continue;
      }

      const s = structures.get(row.subject_id);
      if (!s || s.programId !== pe.program_id) continue;
      if (
        s.courseIds.length > 0 &&
        (!pe.course_id || !s.courseIds.includes(pe.course_id))
      ) {
        continue;
      }
      if (
        s.strandIds.length > 0 &&
        (!pe.strand_id || !s.strandIds.includes(pe.strand_id))
      ) {
        continue;
      }

      const isCurrent = pe.section_id
        ? row.section_id === pe.section_id
        : !!pe.level_id && s.levelIds.includes(pe.level_id);
      const isLower =
        !isCurrent &&
        isIrregular &&
        studentRank !== null &&
        s.levelRanks.length > 0 &&
        s.levelRanks.every((r) => r < studentRank);

      if (isCurrent) candidates.push({ row, scope: 'current' });
      else if (isLower) candidates.push({ row, scope: 'lower' });
    }

    const eligibility =
      await this.subjectPrerequisiteService.checkEligibilityBatch(
        unique(candidates.map((c) => c.row.subject_id)),
        studentId,
        orgId,
      );

    const classes: RequestableClassView[] = [];
    const blockedBySubject = new Map<string, BlockedClassView>();
    for (const { row, scope } of candidates) {
      const view = views.get(row.id);
      if (!view) continue;
      const verdict = eligibility.get(row.subject_id);
      if (verdict && !verdict.eligible) {
        if (!blockedBySubject.has(row.subject_id)) {
          blockedBySubject.set(row.subject_id, {
            ...view,
            scope,
            missing: verdict.missing,
          });
        }
        continue;
      }
      classes.push({
        ...view,
        scope,
        isFull: view.capacity > 0 && view.enrolledCount >= view.capacity,
      });
    }

    const enrolled = [...enrolledClassIds]
      .map((id) => views.get(id))
      .filter((v): v is ClassView => !!v);

    const programSemesters = semesters.filter(
      (s) => s.program_id === pe.program_id,
    );
    const semesterPool = programSemesters.length > 0 ? programSemesters : semesters;

    let latestRequest: LatestRequestView | null = null;
    if (latest) {
      const approved = latest.admin_approved_class_ids ?? [];
      const decide = (classId: string): RequestDecision => {
        if (latest.status === 'pending_review') return 'pending';
        return approved.includes(classId) ? 'approved' : 'denied';
      };
      latestRequest = {
        id: latest.id,
        status: latest.status,
        origin: latest.origin,
        requestedAt: latest.requested_at,
        classes: (latest.student_requested_class_ids ?? [])
          .map((id) => views.get(id))
          .filter((v): v is ClassView => !!v)
          .map((v) => ({ ...v, decision: decide(v.classId) })),
      };
    }

    return {
      placement: {
        studentSchoolYearId: ssy.id,
        programEnrollmentId: pe.id,
        schoolYearId,
        schoolYearName: ssy.schoolYear?.name ?? '',
        programName: pe.program?.name ?? '',
        levelName: pe.level?.name ?? null,
        levelRank: studentRank,
        sectionId: pe.section_id,
        sectionName: pe.section?.name ?? null,
        isIrregular,
      },
      semesters: semesterPool.map((s) => ({
        id: s.id,
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date,
      })),
      classes,
      blocked: [...blockedBySubject.values()],
      enrolled,
      latestRequest,
    };
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(
    orgId: string,
    actor: RequestActor,
    dto: CreateClassAssignmentRequestDto,
  ) {
    const ssy = await this.db.studentSchoolYear.findFirst({
      where: { id: dto.studentSchoolYearId, org_id: orgId },
    });
    if (!ssy) throw new NotFoundException('Student school year not found.');

    if (actor.role === 'student') {
      if (ssy.student_id !== actor.id) {
        throw new ForbiddenException('You can only request subjects for yourself.');
      }
      if (dto.origin !== 'student_request') {
        throw new ForbiddenException('Students can only submit their own requests.');
      }
    }

    if (ssy.status === 'unenrolled') {
      throw new BadRequestException('Student is not enrolled in this school year.');
    }

    const existing = await this.repo.findPendingByStudentSchoolYear(
      dto.studentSchoolYearId,
      orgId,
    );
    if (existing) {
      throw new ConflictException('A pending request already exists for this student.');
    }

    const requestedClassIds = unique(dto.studentRequestedClassIds ?? []);
    if (actor.role === 'student' && requestedClassIds.length === 0) {
      throw new BadRequestException('Select at least one class to request.');
    }

    let requestedSubjectIds = dto.studentRequestedSubjectIds ?? [];
    const warnings: Array<{
      subject_id: string;
      subject_name: string;
      prerequisite_subject_id: string;
      prerequisite_subject_name: string;
      reason: string;
    }> = [];

    if (requestedClassIds.length > 0) {
      requestedSubjectIds = await this.validateRequestedClasses(
        orgId,
        ssy.id,
        ssy.student_id,
        requestedClassIds,
      );
    } else if (requestedSubjectIds.length > 0) {
      const subjects = await this.db.subject.findMany({
        where: { id: { in: requestedSubjectIds }, org_id: orgId, deleted_at: null },
        select: { id: true, name: true },
      });
      if (subjects.length !== requestedSubjectIds.length) {
        throw new BadRequestException('One or more requested subjects not found.');
      }
      const nameMap = new Map(subjects.map((s) => [s.id, s.name]));
      for (const subjectId of requestedSubjectIds) {
        const eligibility = await this.subjectPrerequisiteService.checkEligibility(
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

    const record = await this.repo.create({
      org_id: orgId,
      student_id: ssy.student_id,
      student_school_year_id: ssy.id,
      program_enrollment_id: dto.programEnrollmentId ?? null,
      origin: dto.origin as never,
      status: 'pending_review',
      student_requested_subject_ids: requestedSubjectIds,
      student_requested_class_ids: requestedClassIds,
      admin_finalized_subject_ids: dto.adminFinalizedSubjectIds ?? [],
      has_prerequisite_warning: warnings.length > 0,
      prerequisite_warnings: warnings as unknown as never,
    } as never);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId: actor.id,
        action: 'class_assignment_request_created',
        entityType: 'class_assignment_request',
        entityId: record.id,
        metadata: { origin: dto.origin, studentId: ssy.student_id },
      })
      .catch(() => {});

    if (dto.origin === 'student_request') {
      this.notifyStaffOfRequest(
        orgId,
        ssy.student_id,
        record.id,
        requestedClassIds.length || requestedSubjectIds.length,
      );
    }

    return record;
  }

  /**
   * Server-side re-check of a student's picks: every class must be currently
   * requestable (not taken, prerequisites met, in their placement), not full,
   * one class per subject, and free of overlaps with each other and with what
   * they are already enrolled in. Returns the unique subject ids.
   */
  private async validateRequestedClasses(
    orgId: string,
    studentSchoolYearId: string,
    studentId: string,
    classIds: string[],
  ): Promise<string[]> {
    const availability = await this.getAvailability(studentId, orgId);
    if (
      !availability.placement ||
      availability.placement.studentSchoolYearId !== studentSchoolYearId
    ) {
      throw new BadRequestException(
        'These classes do not belong to the student\'s active school year.',
      );
    }

    const byId = new Map(availability.classes.map((c) => [c.classId, c]));
    const chosen: RequestableClassView[] = [];
    for (const id of classIds) {
      const cls = byId.get(id);
      if (!cls) {
        throw new BadRequestException(
          'One or more selected classes are not available to request.',
        );
      }
      chosen.push(cls);
    }

    const full = chosen.find((c) => c.isFull);
    if (full) {
      throw new BadRequestException(`"${full.subjectName}" is already full.`);
    }

    const subjectIds = unique(chosen.map((c) => c.subjectId));
    if (subjectIds.length !== chosen.length) {
      throw new BadRequestException('Pick only one class per subject.');
    }

    const conflicts = findClassConflicts([...chosen, ...availability.enrolled]);
    if (conflicts.length > 0) {
      const [a, b] = conflicts[0];
      throw new BadRequestException(
        `"${a.subjectName}" and "${b.subjectName}" overlap in the same semester. Choose one.`,
      );
    }

    return subjectIds;
  }

  private async notifyStaffOfRequest(
    orgId: string,
    studentId: string,
    requestId: string,
    count: number,
  ) {
    try {
      const profile = await this.db.profile.findFirst({
        where: { account_id: studentId },
        select: { full_name: true },
      });
      await this.notificationService.notifyOrgStaff(
        orgId,
        'class_request_submitted',
        {
          studentId,
          studentName: profile?.full_name ?? null,
          requestId,
          count,
          linkTo: `/admin/students/${studentId}/review`,
        },
      );
    } catch {
      // Notifications never block the request.
    }
  }

  private notifyStudentReviewed(
    orgId: string,
    record: RequestRow,
    approvedCount: number,
    deniedCount: number,
  ) {
    this.notificationService
      .createNotification({
        orgId,
        accountId: record.student_id,
        type: 'class_request_reviewed',
        payload: {
          requestId: record.id,
          origin: record.origin,
          approvedCount,
          deniedCount,
          linkTo: '/student/classes',
        },
      })
      .catch(() => {});
  }

  // ── Finalize ──────────────────────────────────────────────────────────────

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

    if (dto.approvedClassIds !== undefined) {
      return this.finalizeWithClasses(
        record,
        orgId,
        actorId,
        unique(dto.approvedClassIds),
      );
    }
    if (dto.adminFinalizedSubjectIds === undefined) {
      throw new BadRequestException('Provide approvedClassIds.');
    }
    return this.finalizeLegacy(record, orgId, actorId, dto.adminFinalizedSubjectIds);
  }

  private async finalizeLegacy(
    record: RequestRow,
    orgId: string,
    actorId: string,
    subjectIds: string[],
  ) {
    if (subjectIds.length > 0) {
      const subjects = await this.db.subject.findMany({
        where: { id: { in: subjectIds }, org_id: orgId, deleted_at: null },
        select: { id: true },
      });
      if (subjects.length !== subjectIds.length) {
        throw new BadRequestException('One or more finalized subjects not found.');
      }
    }

    const updated = await this.repo.finalize(record.id, subjectIds, actorId);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_assignment_request_finalized',
        entityType: 'class_assignment_request',
        entityId: record.id,
        metadata: { finalizedCount: subjectIds.length },
      })
      .catch(() => {});

    this.notifyStudentReviewed(orgId, record, subjectIds.length, 0);
    return updated;
  }

  private async finalizeWithClasses(
    record: RequestRow,
    orgId: string,
    actorId: string,
    approved: string[],
  ) {
    const requested = record.student_requested_class_ids ?? [];
    if (requested.length > 0 && approved.some((id) => !requested.includes(id))) {
      throw new BadRequestException('Only requested classes can be approved.');
    }

    const ssy = await this.db.studentSchoolYear.findFirst({
      where: { id: record.student_school_year_id, org_id: orgId },
      select: { school_year_id: true },
    });
    if (!ssy) throw new NotFoundException('Student school year not found.');

    const classes = await this.db.class.findMany({
      where: {
        id: { in: approved },
        org_id: orgId,
        deleted_at: null,
        school_year_id: ssy.school_year_id,
      },
      select: { id: true, subject_id: true, semester_id: true, capacity: true },
    });
    if (classes.length !== approved.length) {
      throw new BadRequestException(
        'One or more approved classes no longer exist in this school year.',
      );
    }

    const existing = await this.db.enrollment.findMany({
      where: {
        org_id: orgId,
        student_id: record.student_id,
        class: { school_year_id: ssy.school_year_id, deleted_at: null },
      },
      select: {
        id: true,
        class_id: true,
        status: true,
        class: { select: { subject_id: true, semester_id: true } },
      },
    });
    const existingByClass = new Map(existing.map((e) => [e.class_id, e]));
    const activeExisting = existing.filter((e) => e.status !== 'removed');

    const toEnroll = classes.filter((c) => {
      const prior = existingByClass.get(c.id);
      return !prior || prior.status === 'removed';
    });

    const counts = await this.db.enrollment.groupBy({
      by: ['class_id'],
      where: {
        org_id: orgId,
        class_id: { in: toEnroll.map((c) => c.id) },
        status: 'active',
      },
      _count: { _all: true },
    });
    const activeCount = new Map(counts.map((c) => [c.class_id, c._count._all]));

    const views = await this.loadClassViews(orgId, [
      ...approved,
      ...activeExisting.map((e) => e.class_id),
    ]);
    const nameOf = (classId: string): string =>
      views.get(classId)?.subjectName ?? 'a class';

    const errors: string[] = [];

    const seenSubjects = new Set<string>();
    for (const cls of toEnroll) {
      const duplicateInExisting = activeExisting.find(
        (e) =>
          e.class_id !== cls.id &&
          e.class.subject_id === cls.subject_id &&
          e.class.semester_id === cls.semester_id,
      );
      if (duplicateInExisting || seenSubjects.has(cls.subject_id)) {
        errors.push(`The student already has "${nameOf(cls.id)}" this semester.`);
      }
      seenSubjects.add(cls.subject_id);

      const taken = activeCount.get(cls.id) ?? 0;
      if (cls.capacity > 0 && taken >= cls.capacity) {
        errors.push(`"${nameOf(cls.id)}" is full (${taken}/${cls.capacity}).`);
      }
    }

    const newIds = new Set(toEnroll.map((c) => c.id));
    const conflictPool = [
      ...toEnroll.map((c) => views.get(c.id)),
      ...activeExisting.map((e) => views.get(e.class_id)),
    ].filter((v): v is ClassView => !!v);
    for (const [a, b] of findClassConflicts(conflictPool)) {
      if (newIds.has(a.classId) || newIds.has(b.classId)) {
        errors.push(`"${a.subjectName}" and "${b.subjectName}" overlap.`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(unique(errors).join(' '));
    }

    const subjectIds = unique(classes.map((c) => c.subject_id));
    const updated = await this.db.$transaction(async (tx) => {
      for (const cls of toEnroll) {
        const prior = existingByClass.get(cls.id);
        if (prior) {
          await tx.enrollment.update({
            where: { id: prior.id },
            data: { status: 'active' },
          });
        } else {
          await tx.enrollment.create({
            data: {
              org_id: orgId,
              class_id: cls.id,
              student_id: record.student_id,
              status: 'active',
            },
          });
        }

        if ((activeCount.get(cls.id) ?? 0) === 0) {
          await tx.gradingScheme.updateMany({
            where: { class_id: cls.id, org_id: orgId, is_locked: false },
            data: { is_locked: true, locked_at: new Date() },
          });
        }
      }

      return tx.classAssignmentRequest.update({
        where: { id: record.id },
        data: {
          admin_finalized_subject_ids: subjectIds,
          admin_approved_class_ids: approved,
          status: 'ready',
          finalized_at: new Date(),
          finalized_by: actorId,
          reopen_reason: null,
        },
      });
    });

    const deniedCount =
      requested.length > 0
        ? requested.filter((id) => !approved.includes(id)).length
        : 0;

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'class_assignment_request_finalized',
        entityType: 'class_assignment_request',
        entityId: record.id,
        metadata: {
          approvedCount: approved.length,
          deniedCount,
          enrolledCount: toEnroll.length,
        },
      })
      .catch(() => {});

    this.notifyStudentReviewed(orgId, record, approved.length, deniedCount);
    return updated;
  }

  // ── Reopen ────────────────────────────────────────────────────────────────

  async reopen(
    id: string,
    orgId: string,
    actorId: string,
    dto: ReopenClassAssignmentRequestDto,
  ) {
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

  // ── Reads ─────────────────────────────────────────────────────────────────

  private async withClasses<T extends RequestRow>(orgId: string, rows: T[]) {
    const ids = rows.flatMap((r) => [
      ...(r.student_requested_class_ids ?? []),
      ...(r.admin_approved_class_ids ?? []),
    ]);
    const views = await this.loadClassViews(orgId, ids);

    return rows.map((r) => {
      const requested = r.student_requested_class_ids ?? [];
      const approved = r.admin_approved_class_ids ?? [];
      return {
        ...r,
        requestedClasses: requested
          .map((id) => views.get(id))
          .filter((v): v is ClassView => !!v),
        approvedClassIds: approved,
        deniedClassIds:
          r.status === 'ready' ? requested.filter((id) => !approved.includes(id)) : [],
      };
    });
  }

  async list(
    orgId: string,
    actor: RequestActor,
    filters: {
      studentId?: string;
      schoolYearId?: string;
      status?: string;
      hasPrerequisiteWarning?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.ClassAssignmentRequestWhereInput = {};
    const studentId = actor.role === 'student' ? actor.id : filters.studentId;
    if (studentId) where.student_id = studentId;
    if (filters.schoolYearId) {
      where.studentSchoolYear = { school_year_id: filters.schoolYearId };
    }
    if (filters.status) where.status = filters.status as never;
    if (filters.hasPrerequisiteWarning !== undefined) {
      const v = String(filters.hasPrerequisiteWarning).toLowerCase();
      if (v === 'true' || v === '1') where.has_prerequisite_warning = true;
      else if (v === 'false' || v === '0') where.has_prerequisite_warning = false;
    }

    const [rows, total] = await this.repo.findMany(orgId, where, page, limit);
    const data = await this.withClasses(orgId, rows);
    return { data, total, page, limit };
  }

  async findById(id: string, orgId: string, actor?: RequestActor) {
    const record = await this.repo.findById(id, orgId);
    if (!record) throw new NotFoundException('Request not found.');
    if (actor?.role === 'student' && record.student_id !== actor.id) {
      throw new NotFoundException('Request not found.');
    }
    const [withClasses] = await this.withClasses(orgId, [record]);
    return withClasses;
  }

  // Helper for batch enrollment to exclude pending students
  async getPendingStudentIds(orgId: string, schoolYearId: string): Promise<string[]> {
    const rows = await this.repo.findPendingStudentIds(orgId, schoolYearId);
    return rows.map((r) => r.student_id);
  }
}