// src/modules/student/student.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StudentRepository } from './student.repository';
import { SectionService } from 'src/modules/section/section.service';
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
import { hashPassword } from 'src/commons/utils/hash.util';

// Transitions that require explicit Admin confirmation
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
  ) {}

  // ── POST /students ──────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateStudentDto) {
    // Guard: email unique within org
    const emailTaken = await this.studentRepository.findByEmail(
      dto.email,
      orgId,
    );
    if (emailTaken) {
      throw new ConflictException(
        'An account with this email already exists in the organization.',
      );
    }

    // Guard: studentId unique within org
    const idTaken = await this.studentRepository.findByStudentId(
      dto.studentId,
      orgId,
    );
    if (idTaken) {
      throw new ConflictException(
        'A student with this Student ID already exists in the organization.',
      );
    }

    // Section capacity check
    let status = StudentStatus.ACTIVE;
    if (dto.sectionId) {
      const section = await this.sectionService.findById(dto.sectionId, orgId);
      const currentCount = await this.sectionService.countStudentsInSection(dto.sectionId);

      if (currentCount >= section.capacity) {
        // Section is full — student created as Pending, no section assigned
        // Admin must resolve: create new section or leave as Pending
        status = StudentStatus.PENDING;
        dto.sectionId = undefined;
      }
    } else {
      // No section assigned — student starts as pending
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

    return {
      ...this.formatAccount(account),
      plainPassword, // returned once for Admin to distribute
    };
  }

  // ── GET /students ───────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryStudentDto) {
    const accounts = await this.studentRepository.findAll(orgId, {
      search: query.search,
      status: query.status,
      levelId: query.levelId,
      sectionId: query.sectionId,
    });

    // Filter by levelId / sectionId from metadata if provided
    let results = accounts.map((a) => this.formatAccount(a));

    if (query.levelId) {
      results = results.filter((s) => s.levelId === query.levelId);
    }

    if (query.sectionId) {
      results = results.filter((s) => s.sectionId === query.sectionId);
    }

    return results;
  }

  // ── GET /students/:id ───────────────────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const account = await this.studentRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    return this.formatAccount(account);
  }

  // ── PATCH /students/:id ─────────────────────────────────────────────────────

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

    const updated = await this.studentRepository.updateProfile(id, {
      fullName: dto.fullName,
      email: dto.email,
      levelId: dto.levelId,
      sectionId: dto.sectionId,
    });

    return this.formatAccount(updated);
  }

  // ── PATCH /students/:id/status ──────────────────────────────────────────────

  async updateStatus(id: string, orgId: string, dto: UpdateStudentStatusDto) {
    const account = await this.studentRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    const currentStatus = account.status as StudentStatus;
    const newStatus = dto.status;

    // Block reversing irreversible statuses back to active without confirmation
    // The confirmation flag is handled at the controller/client level —
    // here we enforce the rule that dropped/transferred/graduated are terminal
    // unless the caller explicitly includes a reason (Phase 4 will log this)
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

    // Phase 4 hook: emit STUDENT_STATUS_CHANGED event for audit log
    // this.eventService.emit(EVENTS.STUDENT_STATUS_CHANGED, {
    //   studentId: id, orgId, oldStatus: currentStatus, newStatus, reason: dto.reason,
    // });

    const updated = await this.studentRepository.updateStatus(id, newStatus);
    return this.formatAccount(updated);
  }

  // ── POST /students/import ───────────────────────────────────────────────────

  async bulkImport(orgId: string, csvContent: string) {
    const rows = parseCsv(csvContent);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or malformed.');
    }

    const validationReport: Array<{
      row: number;
      data: Record<string, string>;
      errors: string[];
    }> = [];

    const validRows: Array<{
      row: number;
      data: Record<string, string>;
    }> = [];

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const rowNum = i + 2; // +2 for header row + 1-based index

      if (!row['Full Name']) errors.push('Full Name is required.');
      if (!row['Student ID']) errors.push('Student ID is required.');
      if (!row['Email']) errors.push('Email is required.');
      if (!row['Level ID']) errors.push('Level ID is required.');

      if (row['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
        errors.push('Email format is invalid.');
      }

      // Check email uniqueness within org
      if (row['Email']) {
        const emailTaken = await this.studentRepository.findByEmail(
          row['Email'],
          orgId,
        );
        if (emailTaken) errors.push(`Email "${row['Email']}" already exists.`);
      }

      // Check studentId uniqueness within org
      if (row['Student ID']) {
        const idTaken = await this.studentRepository.findByStudentId(
          row['Student ID'],
          orgId,
        );
        if (idTaken)
          errors.push(`Student ID "${row['Student ID']}" already exists.`);
      }

      if (errors.length > 0) {
        validationReport.push({ row: rowNum, data: row, errors });
      } else {
        validRows.push({ row: rowNum, data: row });
      }
    }

    // Return validation report before creating — Admin reviews first
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

    // All rows valid — create accounts
    const created = [];
    for (const { data } of validRows) {
      const plainPassword = generateSystemPassword();
      const hashedPassword = await hashPassword(plainPassword);
      const status = data['Section ID'] ? 'active' : 'pending';

      const account = await this.studentRepository.create({
        orgId,
        email: data['Email'],
        hashedPassword,
        status,
        fullName: data['Full Name'],
        studentId: data['Student ID'],
        levelId: data['Level ID'],
        sectionId: data['Section ID'] || undefined,
      });

      created.push({
        ...this.formatAccount(account),
        plainPassword,
      });
    }

    return {
      status: 'success',
      totalCreated: created.length,
      students: created,
    };
  }

  // ── POST /students/:id/reset-password ───────────────────────────────────────

  async resetPassword(id: string, orgId: string) {
    const account = await this.studentRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Student not found.');
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    await this.studentRepository.updatePassword(id, hashedPassword);

    return { id, plainPassword };
  }

  // ── GET /students/credentials-csv ───────────────────────────────────────────

  async getCredentialsCsv(orgId: string): Promise<string> {
    const accounts = await this.studentRepository.findAllForExport(orgId);

    const rows = accounts.map((a) => {
      const meta = (a.profile?.metadata as Record<string, any>) ?? {};
      return {
        fullName: a.profile?.full_name ?? '',
        studentId: meta.studentId ?? '',
        email: a.email,
        plainPassword: '••••••••••', // passwords not re-exposed in CSV export
        levelId: meta.levelId ?? '',
        sectionId: meta.sectionId ?? '',
        status: a.status,
      };
    });

    return buildCredentialsCsv(rows);
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  formatAccount(account: any) {
    const meta = (account.profile?.metadata as Record<string, any>) ?? {};
    return {
      id: account.id,
      orgId: account.org_id,
      email: account.email,
      status: account.status,
      fullName: account.profile?.full_name ?? null,
      studentId: meta.studentId ?? null,
      levelId: meta.levelId ?? null,
      sectionId: meta.sectionId ?? null,
      createdAt: account.created_at,
    };
  }
}