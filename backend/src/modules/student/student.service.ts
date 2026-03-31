// backend/src/modules/student/student.service.ts

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
} from './dto/student.dto';
import {
  generateSystemPassword,
  parseCsv,
  buildCredentialsCsv,
} from './student.utils';
import { hashPassword } from '@/commons/utils/hash.util';
import { ClassRepository } from '../class/class.repository';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';

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
  ) {}

  // Safe metadata extraction — guards against null, non-object, or array JSON values
  private extractMeta(account: Record<string, any>): Record<string, any> {
    const raw = account?.profile?.metadata;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as Record<string, any>;
  }

  formatAccount(account: Record<string, any>) {
    const meta = this.extractMeta(account);
    return {
      id: account.id as string,
      orgId: account.org_id as string,
      email: account.email as string,
      status: account.status as string,
      fullName: (account.profile?.full_name ?? null) as string | null,
      studentId: (meta['studentId'] ?? null) as string | null,
      levelId: (meta['levelId'] ?? null) as string | null,
      sectionId: (meta['sectionId'] ?? null) as string | null,
      createdAt: account.created_at as Date,
    };
  }

  async create(orgId: string, dto: CreateStudentDto) {
    const emailTaken = await this.studentRepository.findByEmail(
      dto.email,
      orgId,
    );
    if (emailTaken) {
      throw new ConflictException(
        'An account with this email already exists in the organization.',
      );
    }

    const idTaken = await this.studentRepository.findByStudentId(
      dto.studentId,
      orgId,
    );
    if (idTaken) {
      throw new ConflictException(
        'A student with this Student ID already exists in the organization.',
      );
    }

    let status = StudentStatus.ACTIVE;

    if (dto.sectionId) {
      const section = await this.sectionService.findById(dto.sectionId, orgId);
      const currentCount = await this.sectionService.countStudentsInSection(
        dto.sectionId,
      );
      if (currentCount >= section.capacity) {
        status = StudentStatus.PENDING;
        dto.sectionId = undefined;
      }
    } else {
      status = StudentStatus.PENDING;
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const account = await this.studentRepository.create({
      orgId,
      email: dto.email,
      hashedPassword,
      status,
      fullName: dto.fullName,
      studentId: dto.studentId,
      levelId: dto.levelId,
      sectionId: dto.sectionId,
    });

    // plainPassword returned once for admin to distribute — never persisted or logged
    return {
      ...this.formatAccount(account),
      plainPassword,
    };
  }

  async findAll(orgId: string, query: QueryStudentDto) {
    const accounts = await this.studentRepository.findAll(orgId, {
      search: query.search,
      status: query.status,
      levelId: query.levelId,
      sectionId: query.sectionId,
    });

    let results = accounts.map((a) =>
      this.formatAccount(a as Record<string, any>),
    );

    if (query.levelId) {
      results = results.filter((s) => s.levelId === query.levelId);
    }

    if (query.sectionId) {
      results = results.filter((s) => s.sectionId === query.sectionId);
    }

    return results;
  }

  async findById(id: string, orgId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Student not found.');
    }
    return this.formatAccount(account as Record<string, any>);
  }

  async update(id: string, orgId: string, dto: UpdateStudentDto) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    if (dto.email && dto.email !== account.email) {
      const emailTaken = await this.studentRepository.findByEmail(
        dto.email,
        orgId,
      );
      if (emailTaken) {
        throw new ConflictException(
          'An account with this email already exists in the organization.',
        );
      }
    }

    if (dto.sectionId) {
      const section = await this.sectionService.findById(dto.sectionId, orgId);
      const currentCount = await this.sectionService.countStudentsInSection(
        dto.sectionId,
      );
      if (currentCount >= section.capacity) {
        throw new BadRequestException(
          `Section has reached its capacity of ${section.capacity} students.`,
        );
      }
    }

    const updated = await this.studentRepository.updateProfile(id, {
      fullName: dto.fullName,
      email: dto.email,
      levelId: dto.levelId,
      sectionId: dto.sectionId,
    });

    return this.formatAccount(updated as Record<string, any>);
  }

  async updateStatus(id: string, orgId: string, dto: UpdateStudentStatusDto) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    const currentStatus = account.status as StudentStatus;
    const newStatus = dto.status;

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
    return this.formatAccount(updated as Record<string, any>);
  }

  async bulkImport(orgId: string, csvContent: string) {
    const rows = parseCsv(csvContent);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or malformed.');
    }

    // Batch duplicate checks — avoids N×2 individual DB queries
    const emails = rows.map((r) => r['Email']).filter(Boolean);
    const studentIds = rows.map((r) => r['Student ID']).filter(Boolean);

    const [existingEmails, existingStudentIds] = await Promise.all([
      this.studentRepository.findEmailsInBatch(emails, orgId),
      this.studentRepository.findStudentIdsInBatch(studentIds, orgId),
    ]);

    const takenEmailSet = new Set(existingEmails);
    const takenIdSet = new Set(existingStudentIds);

    const validationReport: Array<{
      row: number;
      data: Record<string, string>;
      errors: string[];
    }> = [];

    const validRows: Array<{ row: number; data: Record<string, string> }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const rowNum = i + 2;

      if (!row['Full Name']) errors.push('Full Name is required.');
      if (!row['Student ID']) errors.push('Student ID is required.');
      if (!row['Email']) errors.push('Email is required.');
      if (!row['Level ID']) errors.push('Level ID is required.');

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
        status: 'validation_failed',
        totalRows: rows.length,
        validCount: validRows.length,
        invalidCount: validationReport.length,
        errors: validationReport,
        message:
          'Fix the errors and re-upload, or proceed with valid rows only.',
      };
    }

    const created: Array<ReturnType<typeof this.formatAccount> & { plainPassword: string }> = [];

    for (const { data } of validRows) {
      const plainPassword = generateSystemPassword();
      const hashedPassword = await hashPassword(plainPassword);
      let rowStatus = StudentStatus.PENDING;
      let sectionId: string | undefined = data['Section ID'] || undefined;

      if (sectionId) {
        const section = await this.sectionService.findById(sectionId, orgId);
        const currentCount =
          await this.sectionService.countStudentsInSection(sectionId);
        if (currentCount >= section.capacity) {
          rowStatus = StudentStatus.PENDING;
          sectionId = undefined;
        } else {
          rowStatus = StudentStatus.ACTIVE;
        }
      }

      const account = await this.studentRepository.create({
        orgId,
        email: data['Email'],
        hashedPassword,
        status: rowStatus,
        fullName: data['Full Name'],
        studentId: data['Student ID'],
        levelId: data['Level ID'],
        sectionId,
      });

      // plainPassword is for admin distribution only — never persisted or logged
      created.push({ ...this.formatAccount(account), plainPassword });
    }

    return { status: 'success', totalCreated: created.length, students: created };
  }

  async resetPassword(id: string, orgId: string) {
    const account = await this.studentRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);
    await this.studentRepository.updatePassword(id, hashedPassword);

    // plainPassword returned once for admin — never persisted or logged
    return { id, plainPassword };
  }

  async getCredentialsCsv(orgId: string): Promise<string> {
    const accounts = await this.studentRepository.findAllForExport(orgId);

    const rows = accounts.map((a) => {
      const meta = this.extractMeta(a as Record<string, any>);
      return {
        fullName: a.profile?.full_name ?? '',
        studentId: (meta['studentId'] ?? '') as string,
        email: a.email,
        plainPassword: '••••••••••',
        levelId: (meta['levelId'] ?? '') as string,
        sectionId: (meta['sectionId'] ?? '') as string,
        status: a.status,
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
      'level-uuid-here',
      'section-uuid-here (optional)',
    ];
    return [headers.join(','), example.join(',')].join('\n');
  }

  async getEnrollments(studentId: string, orgId: string) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');
    return this.enrollmentRepo.findByStudentAcrossOrg(studentId, orgId);
  }

  async addEnrollment(studentId: string, orgId: string, classId: string) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    if (account.status !== 'active') {
      throw new BadRequestException(
        'Only active students can be enrolled in a class.',
      );
    }

    const cls = await this.classRepository.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

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

    const existing = await this.enrollmentRepo.findByStudent(
      classId,
      studentId,
      orgId,
    );
    if (existing && existing.status !== 'removed') {
      throw new ConflictException('Student is already enrolled in this class.');
    }

    if (cls.capacity > 0) {
      const activeCount = await this.enrollmentRepo.countActive(classId);
      if (activeCount >= cls.capacity) {
        return {
          overflow: true,
          message: `Class is at full capacity (${cls.capacity} students).`,
          classId,
          studentId,
        };
      }
    }

    return this.enrollmentRepo.create({
      orgId,
      classId,
      studentId,
      status: 'active',
    });
  }

  async deleteEnrollment(
    studentId: string,
    enrollmentId: string,
    orgId: string,
  ) {
    const account = await this.studentRepository.findById(studentId, orgId);
    if (!account) throw new NotFoundException('Student not found.');

    const enrollment = await this.enrollmentRepo.findById(enrollmentId, orgId);
    if (!enrollment || enrollment.student_id !== studentId) {
      throw new NotFoundException('Enrollment not found.');
    }

    if (enrollment.status === 'removed') {
      throw new ConflictException('Enrollment is already removed.');
    }

    return this.enrollmentRepo.updateStatus(enrollmentId, 'removed');
  }

  async getEducatorClasses(educatorId: string, orgId: string) {
    const classes = await this.classRepository.findAll(orgId, { educatorId });

    return Promise.all(
      classes.map(async (cls) => {
        const { subject } = await this.classRepository.findSubjectWithEducator(
          cls.subject_id,
          cls.educator_id,
          orgId,
        );
        return {
          id: cls.id,
          subjectId: cls.subject_id,
          subjectName: subject?.name ?? null,
          sectionId: cls.section_id,
          schoolYearId: cls.school_year_id,
          semesterId: cls.semester_id,
          capacity: cls.capacity,
          schedules: cls.schedules,
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