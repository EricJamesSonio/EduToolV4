// @/modules/student/student.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StudentRepository } from './student.repository';
import { SectionService } from '@/modules/section/section.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentStatusDto,
  QueryStudentDto,
  StudentStatus,
  BulkCreateStudentDto,
} from './dto/student.dto';
import {
  generateSystemPassword,
  parseCsv,
  buildCredentialsCsv,
} from './student.utils';
import { hashPassword } from '@/commons/utils/hash.util';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { ClassRepository } from '../class/class.repository';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import {
  resolveSubjectAcademicStructure,
  isEligibleForClassStructure,
} from '../enrollment/enrollment-eligibility.util';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationService } from '../organization/organization.service';

const IRREVERSIBLE_STATUSES: StudentStatus[] = [
  StudentStatus.DROPPED,
  StudentStatus.TRANSFERRED,
  StudentStatus.GRADUATED,
];

@Injectable()
export class StudentService {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly sectionService: SectionService,
    private readonly classRepository: ClassRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly auditLogService: AuditLogService,   // ← INJECTED
    private readonly organizationService: OrganizationService,
    private readonly db: DatabaseService,
  ) {}

  private extractMeta(account: Record<string, any>): Record<string, any> {
    const raw = account?.profile?.metadata;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as Record<string, any>;
  }

  formatAccount(account: Record<string, any>) {
    const meta = this.extractMeta(account);
    return {
      id:            account.id as string,
      orgId:         account.org_id as string,
      email:         account.email as string,
      status:        account.status as string,
      fullName:      (account.profile?.full_name ?? null) as string | null,
      studentId:     (meta['studentId'] ?? null) as string | null,
      levelId:       (meta['levelId'] ?? null) as string | null,
      sectionId:     (meta['sectionId'] ?? null) as string | null,
      createdAt:     account.created_at as Date,
      personalEmail: (account.profile?.personal_email ?? null) as string | null,
      profileImage:  (account.profile?.profile_image ?? null) as string | null,
    };
  }

  private async buildOrgEmail(orgId: string, emailName: string) {
    const org = await this.organizationService.getOwn(orgId);
    const extension = org?.emailExtension?.trim();
    if (!extension) {
      throw new BadRequestException(
        'Set the organization email extension before creating student accounts.',
      );
    }

    const localPart = emailName.trim().replace(/^@+/, '');
    if (!localPart || localPart.includes('@')) {
      throw new BadRequestException('Email name must not include an email extension.');
    }

    const base = extension.replace(/^@/, '').replace(/\.(student|educator)\./g, '.').trim();
    const dotIdx = base.indexOf('.');
    const domain = dotIdx >= 0
      ? `${base.slice(0, dotIdx)}.student${base.slice(dotIdx)}`
      : `student.${base}`;

    return `${localPart}@${domain}`.toLowerCase();
  }

  // ── POST /students/bulk ──────────────────────────────────────────────────────

  async bulkCreate(orgId: string, entries: Array<{ fullName: string; id: string }>) {
    const sanitized = entries.map((e) => ({
      fullName: this.sanitizeName(e.fullName),
      id: e.id.trim(),
    })).filter((e) => e.fullName.length >= 2 && e.id.length >= 1);

    if (sanitized.length === 0) {
      throw new BadRequestException('No valid entries provided.');
    }

    const usedEmailNames = new Set<string>();
    const withEmailName = sanitized.map((e) => {
      const emailName = this.generateEmailName(e.fullName, usedEmailNames);
      usedEmailNames.add(emailName);
      return { ...e, emailName };
    });

    const withEmails = await Promise.all(
      withEmailName.map(async (e) => ({
        ...e,
        email: await this.buildOrgEmail(orgId, e.emailName),
      })),
    );

    const allEmails = withEmails.map((e) => e.email);
    const existing = await this.studentRepository.findEmailsInBatch(allEmails, orgId);
    if (existing.length > 0) {
      throw new ConflictException(
        `Emails already exist: ${existing.join(', ')}. Remove duplicates and retry.`,
      );
    }

    const created: Array<{
      fullName: string; email: string; studentId: string; plainPassword: string;
    }> = [];

    for (const { fullName, email, id } of withEmails) {
      const plainPassword = generateSystemPassword();
      const hashedPassword = await hashPassword(plainPassword);

      await this.studentRepository.create({
        orgId,
        email,
        hashedPassword,
        status: StudentStatus.PENDING,
        fullName,
        studentId: id,
      });

      created.push({ fullName, email, studentId: id, plainPassword });
    }

    return created;
  }

  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateEmailName(fullName: string, used: Set<string>): string {
    let candidate = fullName.toLowerCase().replace(/\s+/g, '');
    if (!candidate) candidate = 'student';
    let emailName = candidate;
    let counter = 1;
    while (used.has(emailName)) {
      emailName = `${candidate}${counter}`;
      counter++;
    }
    return emailName;
  }

  async create(orgId: string, dto: CreateStudentDto, tx?: Prisma.TransactionClient) {
    const email = await this.buildOrgEmail(orgId, dto.emailName);

    const emailTaken = await this.studentRepository.findByEmail(email, orgId);
    if (emailTaken) {
      throw new ConflictException(
        'An account with this email already exists in the organization.',
      );
    }

    const idTaken = await this.studentRepository.findByStudentId(dto.studentId, orgId);
    if (idTaken) {
      throw new ConflictException(
        'A student with this Student ID already exists in the organization.',
      );
    }

    const plainPassword  = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const account = await this.studentRepository.create({
      orgId,
      email,
      hashedPassword,
      status:         dto.status ?? StudentStatus.PENDING,
      fullName:       dto.fullName,
      studentId:      dto.studentId,
      levelId:        dto.levelId,
      sectionId:      dto.sectionId,
      personalEmail:  dto.personalEmail ?? null,
    }, tx);

    return { ...this.formatAccount(account), plainPassword };
  }

  async findAll(orgId: string, query: QueryStudentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.studentRepository.findAll(orgId, {
      search:       query.search,
      status:       query.status,
      schoolYearId: query.schoolYearId,
      programId:    query.programId,
      courseId:     query.courseId,
      strandId:     query.strandId,
      levelId:      query.levelId,
      sectionId:    query.sectionId,
      page,
      limit,
    });

    return {
      data: data.map((a) => this.formatAccount(a as Record<string, any>)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) throw new NotFoundException('Student not found.');
    return this.formatAccount(account as Record<string, any>);
  }

  // actorId added — the admin performing the action, threaded from controller
  async update(id: string, orgId: string, dto: UpdateStudentDto, actorId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    if (dto.email && dto.email !== account.email) {
      const emailTaken = await this.studentRepository.findByEmail(dto.email, orgId);
      if (emailTaken) {
        throw new ConflictException(
          'An account with this email already exists in the organization.',
        );
      }
    }

    if (dto.sectionId) {
      const section = await this.sectionService.findById(dto.sectionId, orgId);
      const currentCount = await this.sectionService.countStudentsInSection(dto.sectionId);
      if (currentCount >= section.capacity) {
        throw new BadRequestException(
          `Section has reached its capacity of ${section.capacity} students.`,
        );
      }
    }

    const updated = await this.studentRepository.updateProfile(id, {
      fullName:     dto.fullName,
      email:        dto.email,
      levelId:      dto.levelId,
      sectionId:    dto.sectionId,
      profileImage: dto.profileImage,
    });

    // ── Audit log ──────────────────────────────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action:     'student_profile_changed',
      entityType: 'student',
      entityId:   id,
      metadata:   {
        changes: Object.fromEntries(
          Object.entries(dto).filter(([, v]) => v !== undefined),
        ),
      },
    }).catch(() => { /* fire-and-forget — never block the response */ });

    return this.formatAccount(updated as Record<string, any>);
  }

  // actorId added
  async updateStatus(id: string, orgId: string, dto: UpdateStudentStatusDto, actorId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    const currentStatus = account.status as StudentStatus;
    const newStatus     = dto.status;

    if (
      IRREVERSIBLE_STATUSES.includes(currentStatus) &&
      newStatus === StudentStatus.ACTIVE
    ) {
      if (!dto.reason) {
        throw new BadRequestException(
          `Reversing a "${currentStatus}" status back to active requires a reason. ` +
            `This action will be logged in the audit trail.`,
        );
      }
    }

    const updated = await this.studentRepository.updateStatus(id, newStatus);

    // ── Audit log ──────────────────────────────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action:     'student_status_changed',
      entityType: 'student',
      entityId:   id,
      metadata:   {
        from:   currentStatus,
        to:     newStatus,
        reason: dto.reason ?? null,
      },
    }).catch(() => {});

    return this.formatAccount(updated as Record<string, any>);
  }

  async bulkImport(orgId: string, csvContent: string) {
    const rows = parseCsv(csvContent);
    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or malformed.');
    }

    const emails     = rows.map((r) => r['Email']).filter(Boolean);
    const studentIds = rows.map((r) => r['Student ID']).filter(Boolean);

    const [existingEmails, existingStudentIds] = await Promise.all([
      this.studentRepository.findEmailsInBatch(emails, orgId),
      this.studentRepository.findStudentIdsInBatch(studentIds, orgId),
    ]);

    const takenEmailSet = new Set(existingEmails);
    const takenIdSet    = new Set(existingStudentIds);

    const validationReport: Array<{
      row: number;
      data: Record<string, string>;
      errors: string[];
    }> = [];
    const validRows: Array<{ row: number; data: Record<string, string> }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const errors: string[] = [];
      const rowNum = i + 2;

      if (!row['Full Name']) errors.push('Full Name is required.');
      if (!row['Student ID']) errors.push('Student ID is required.');
      if (!row['Email']) errors.push('Email is required.');
      if (row['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
        errors.push('Email format is invalid.');
      }
      if (row['Email'] && takenEmailSet.has(row['Email'])) {
        errors.push(`Email "${row['Email']}" already exists.`);
      }
      if (row['Student ID'] && takenIdSet.has(row['Student ID'])) {
        errors.push(`Student ID "${row['Student ID']}" already exists.`);
      }

      if (errors.length > 0) {
        validationReport.push({ row: rowNum, data: row, errors });
      } else {
        validRows.push({ row: rowNum, data: row });
      }
    }

    if (validationReport.length > 0) {
      return {
        status:       'validation_failed',
        totalRows:    rows.length,
        validCount:   validRows.length,
        invalidCount: validationReport.length,
        errors:       validationReport,
        message:      'Fix the errors and re-upload, or proceed with valid rows only.',
      };
    }

    const created: Array<ReturnType<typeof this.formatAccount> & { plainPassword: string }> = [];

    for (const { data } of validRows) {
      const plainPassword  = generateSystemPassword();
      const hashedPassword = await hashPassword(plainPassword);

      const account = await this.studentRepository.create({
        orgId,
        email:          data['Email'],
        hashedPassword,
        status:         StudentStatus.PENDING,
        fullName:       data['Full Name'],
        studentId:      data['Student ID'],
        levelId:        data['Level ID'] || undefined,
        sectionId:      data['Section ID'] || undefined,
      });

      created.push({ ...this.formatAccount(account), plainPassword });
    }

    return { status: 'success', totalCreated: created.length, students: created };
  }

  // actorId added
  async resetPassword(id: string, orgId: string, actorId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    const plainPassword  = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    await this.studentRepository.updatePassword(id, hashedPassword);

    // ── Audit log ──────────────────────────────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action:     'password_reset',
      entityType: 'student',
      entityId:   id,
      metadata:   null,
    }).catch(() => {});

    return { id, plainPassword };
  }

  async getCredentialsCsv(orgId: string): Promise<string> {
    const accounts = await this.studentRepository.findAllForExport(orgId);
    const rows = accounts.map((a) => {
      const meta = this.extractMeta(a as Record<string, any>);
      return {
        fullName:      a.profile?.full_name ?? '',
        studentId:     (meta['studentId'] ?? '') as string,
        email:         a.email,
        plainPassword: '••••••••••',
        levelId:       (meta['levelId'] ?? '') as string,
        sectionId:     (meta['sectionId'] ?? '') as string,
        status:        a.status,
      };
    });
    return buildCredentialsCsv(rows);
  }

  getImportTemplate(): string {
    const headers = ['Full Name', 'Student ID', 'Email', 'Level ID', 'Section ID'];
    const example = [
      'Juan Dela Cruz',
      'STU-2024-001',
      'juan@school.edu',
      'level-uuid-here (optional)',
      'section-uuid-here (optional)',
    ];
    return [headers.join(','), example.join(',')].join('\n');
  }

  async getEnrollments(studentId: string, orgId: string) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');
    return this.enrollmentRepo.findByStudentAcrossOrg(studentId, orgId);
  }

  async addEnrollment(studentId: string, orgId: string, classId: string, actorId: string) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    if (account.status !== 'active') {
      throw new BadRequestException('Only active students can be enrolled in a class.');
    }

    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    // ── Academic structure gate ──────────────────────────────────────────
    // Strict: student must belong to the class's program, course/strand, and level.
    const [subjectStructure, studentStructure] = await Promise.all([
      resolveSubjectAcademicStructure(this.db, cls.subject_id, orgId),
      this.enrollmentRepo.findStudentAcademicStructure(
        studentId,
        orgId,
        cls.school_year_id,
      ),
    ]);

    if (
      !isEligibleForClassStructure(subjectStructure, studentStructure, cls.section_id)
    ) {
      const reason = !studentStructure
        ? 'The student has no active academic placement for this school year.'
        : 'The student does not belong to the same program, course/strand, or level assigned to this class.';
      throw new BadRequestException(
        `Student is not eligible for this class. ${reason}`,
      );
    }

    const duplicate = await this.enrollmentRepo.findDuplicate(
      studentId,
      cls.subject_id,
      cls.semester_id,
      orgId,
    );
    if (duplicate) {
      throw new ConflictException(
        'Student is already enrolled in a class for this subject in the same semester.',
      );
    }

    const existing = await this.enrollmentRepo.findByStudent(classId, studentId, orgId);
    if (existing && existing.status !== 'removed') {
      throw new ConflictException('Student is already enrolled in this class.');
    }

    if (cls.capacity > 0) {
      const activeCount = await this.enrollmentRepo.countActive(classId);
      if (activeCount >= cls.capacity) {
        // ── Audit: capacity overflow ──────────────────────────────────────
        this.auditLogService.logAdminAction({
          orgId,
          actorId,
          action:     'class_capacity_overflow',
          entityType: 'class',
          entityId:   classId,
          metadata:   { studentId, capacity: cls.capacity },
        }).catch(() => {});

        return {
          overflow:  true,
          message:   `Class is at full capacity (${cls.capacity} students).`,
          classId,
          studentId,
        };
      }
    }

    const enrollment = await this.enrollmentRepo.create({
      orgId,
      classId,
      studentId,
      status: 'active',
    });

    // ── Audit: enrollment created ─────────────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action:     'enrollment_created',
      entityType: 'enrollment',
      entityId:   (enrollment as any).id,
      metadata:   { studentId, classId },
    }).catch(() => {});

    return enrollment;
  }

  async deleteEnrollment(studentId: string, enrollmentId: string, orgId: string, actorId: string) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    const enrollment = await this.enrollmentRepo.findById(enrollmentId, orgId);
    if (!enrollment || enrollment.student_id !== studentId) {
      throw new NotFoundException('Enrollment not found.');
    }
    if (enrollment.status === 'removed') {
      throw new ConflictException('Enrollment is already removed.');
    }

    const result = await this.enrollmentRepo.updateStatus(enrollmentId, 'removed');

    // ── Audit: enrollment removed ─────────────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId,
      action:     'enrollment_removed',
      entityType: 'enrollment',
      entityId:   enrollmentId,
      metadata:   { studentId, classId: enrollment.class_id },
    }).catch(() => {});

    return result;
  }

  async getEducatorClasses(educatorId: string, orgId: string) {
    const { data: classes } = await this.classRepository.findAll(orgId, { educatorId });
    return Promise.all(
      classes.map(async (cls) => {
        const { subject } = await this.classRepository.findSubjectWithEducator(cls.id);
        return {
          id:           cls.id,
          subjectId:    cls.subject_id,
          subjectName:  subject?.name ?? null,
          sectionId:    cls.section_id,
          schoolYearId: cls.school_year_id,
          semesterId:   cls.semester_id,
          capacity:     cls.capacity,
          schedules:    cls.schedules,
        };
      }),
    );
  }

  async removeEnrollment(classId: string, enrollmentId: string, orgId: string) {
    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const enrollment = await this.enrollmentRepo.findById(enrollmentId, orgId);
    if (!enrollment || enrollment.class_id !== classId) {
      throw new NotFoundException('Enrollment not found.');
    }
    if (enrollment.status === 'removed') {
      throw new BadRequestException('Enrollment is already removed.');
    }

    return this.enrollmentRepo.updateStatus(enrollmentId, 'removed');
  }
}