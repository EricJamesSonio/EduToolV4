// src/modules/enrollment-portal/registrar/enrollment-approval.service.ts
//
// Phase 4 orchestrator. This is deliberately thin: the actual writes are the
// SAME services a registrar uses to manually enroll a student today
// (StudentService.create + StudentEnrollmentService), except everything runs
// inside a single DB transaction so an approval either fully materializes
// (Account + Profile + StudentSchoolYear + StudentProgramEnrollment +
// status=approved) or rolls back — never halfway.
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { StudentService } from '@/modules/student/student.service';
import { StudentEnrollmentService } from '@/modules/student-enrollment/student-enrollment.service';
import { MailService } from '@/modules/mail/mail.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { generateStudentId } from '@/modules/student/student.utils';
import { StudentStatus } from '@/modules/student/dto/student.dto';
import { EnrollmentRegistrarRepository } from './enrollment-registrar.repository';
import { EnrollmentApprovalRepository } from './enrollment-approval.repository';
import { SectionOverflowAction } from '@prisma/client';

@Injectable()
export class EnrollmentApprovalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly repo: EnrollmentApprovalRepository,
    private readonly registrarRepo: EnrollmentRegistrarRepository,
    private readonly studentService: StudentService,
    private readonly enrollmentService: StudentEnrollmentService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async approve(orgId: string, actorId: string, applicationId: string) {
    const app = await this.registrarRepo.findApplicationDetail(
      orgId,
      applicationId,
    );
    if (!app) throw new NotFoundException('Application not found.');

    if (app.status !== 'pending') {
      throw new ConflictException(
        `Only pending applications can be approved (current status: ${app.status}).`,
      );
    }

    const overflowAction =
      app.enrollmentPeriod?.section_overflow_action ??
      SectionOverflowAction.no_section;

    const fullName = [app.first_name, app.middle_name, app.last_name]
      .filter(Boolean)
      .join(' ');

    let section: { id: string; name: string; capacity: number } | null = null;

    const result = await this.db.$transaction(async (tx) => {
      // Resolve the target section inside the transaction so any capacity
      // expand / section-creation stays atomic with the rest of the approval.
      const candidates = await this.repo.findEligibleSectionsTx(tx, {
        orgId,
        schoolYearId: app.school_year_id,
        levelId: app.level_id,
        courseId: app.course_id,
        strandId: app.strand_id,
      });

      let target: { id: string; name: string; capacity: number } | null =
        candidates.find((c) => c._count.studentEnrollments < c.capacity) ??
        null;

      if (!target) {
        if (
          overflowAction === SectionOverflowAction.expand_capacity &&
          candidates.length
        ) {
          const full = candidates[0];
          const capacity = full._count.studentEnrollments + 1;
          await this.repo.expandSectionCapacityTx(tx, full.id, capacity);
          target = { id: full.id, name: full.name, capacity };
        } else if (overflowAction === SectionOverflowAction.auto_create) {
          const created = await this.repo.createOverflowSectionTx(tx, {
            orgId,
            schoolYearId: app.school_year_id,
            levelId: app.level_id,
            courseId: app.course_id,
            strandId: app.strand_id,
            levelName: app.level?.name ?? 'Level',
          });
          target = {
            id: created.id,
            name: created.name,
            capacity: created.capacity,
          };
        }
        // no_section (or unrecoverable) → leave section null and notify below.
      }

      // StudentService.create returns a flattened account object
      // ({ ...formatAccount(account), plainPassword }) rather than a nested shape.
      const created = await this.studentService.create(
        orgId,
        {
          fullName,
          emailName: this.buildEmailName(fullName, app.application_code),
          studentId: generateStudentId(),
          levelId: app.level_id,
          sectionId: target?.id ?? undefined,
          personalEmail: app.personal_email,
          status: StudentStatus.ACTIVE,
        },
        tx,
      );

      const account = created;
      const plainPassword = created.plainPassword;

      await this.enrollmentService.enrollStudent(
        app.school_year_id,
        orgId,
        {
          student_id: account.id,
          notes: `Enrolled via portal application ${app.application_code}`,
        },
        actorId,
        tx,
      );

      await this.enrollmentService.enrollInProgram(
        app.school_year_id,
        account.id,
        orgId,
        {
          program_id: app.program_id,
          level_id: app.level_id,
          course_id: app.course_id ?? undefined,
          strand_id: app.strand_id ?? undefined,
          section_id: target?.id ?? undefined,
        },
        actorId,
        tx,
      );

      const approved = await this.repo.approveInTx(
        tx,
        applicationId,
        actorId,
        account.id,
      );

      return { account, plainPassword, approved, section: target };
    });

    section = result.section;

    // Best-effort post-transaction side effects — never block approval.
    this.mailService
      .sendStudentCredentialsEmail(
        app.personal_email,
        result.account.email,
        result.plainPassword,
      )
      .catch(() => {});

    if (!section) {
      this.notifyCapacityFull(orgId, app).catch(() => {});
    }

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'ENROLLMENT_APPLICATION_APPROVE',
        entityType: 'enrollment_application',
        entityId: applicationId,
        metadata: {
          application_code: app.application_code,
          personal_email: app.personal_email,
          section_id: section?.id ?? null,
          resulting_account_id: result.account.id,
        },
      })
      .catch(() => {});

    return {
      success: true,
      application_id: applicationId,
      section: section ? { id: section.id, name: section.name } : null,
    };
  }

  private async notifyCapacityFull(
    orgId: string,
    app: {
      personal_email: string;
      application_code: string;
      first_name: string;
      last_name: string;
    },
  ) {
    const registrars = await this.repo.findRegistrarAccounts(orgId);
    if (registrars.length === 0) return;
    await this.notificationService.createBulkNotifications(
      registrars.map((r) => ({
        orgId,
        accountId: r.id,
        type: 'enrollment_section_full',
        payload: {
          application_code: app.application_code,
          applicant_email: app.personal_email,
          message:
            `Application ${app.application_code} was approved but every eligible ` +
            `section is full for ${app.first_name} ${app.last_name}. ` +
            'Add a section or increase capacity.',
        },
      })),
    );
  }

  private buildEmailName(fullName: string, suffix: string) {
    const slug = (fullName || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return `${slug || 'student'}${suffix.slice(0, 4)}`;
  }
}
