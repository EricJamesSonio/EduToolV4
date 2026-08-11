import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { hashPassword } from '@/commons/utils/hash.util';
import { generatePassword } from '@/commons/utils/password.util';
import { generateAdminLoginEmail } from '@/commons/utils/admin-login-email.util';
import { DatabaseService } from '@/core/database/database.provider';
import { slugifyName } from '@/modules/organization/organization.repository';
import { PlatformRegistrationRepository } from './platform-registration.repository';
import { MailService } from '@/modules/mail/mail.service';
import { RequestRevisionDto, RejectRequestDto } from './dto/approve-request.dto';

/**
 * Field names on RegistrationRequest that an applicant may be asked to revise.
 * Used to reject unknown keys in a request-revision's fieldNotes rather than
 * silently persisting garbage.
 */
const REQUEST_FIELDS = new Set([
  'full_name',
  'institution_name',
  'role',
  'student_count',
  'programs_departments',
  'plan',
]);

@Injectable()
export class PlatformRegistrationService {
  constructor(
    private readonly repo: PlatformRegistrationRepository,
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  async list(params: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    return this.repo.findMany(params);
  }

  async approve(id: string, reviewedBy: string) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    // Login email is system-generated, decoupled from the personal Gmail.
    const loginEmail = generateAdminLoginEmail(request.email);

    const existing = await this.db.account.findFirst({
      where: { email: loginEmail, deleted_at: null },
    });
    if (existing) {
      throw new BadRequestException(
        `An account with email ${loginEmail} already exists`,
      );
    }

    const password = generatePassword();
    const hashedPassword = await hashPassword(password);

    // Create the Organization (name from the request; slug via the same
    // generator the Enrollment Portal uses) and link the newly created admin.
    const organization = await this.db.organization.create({
      data: {
        name: request.institution_name ?? request.full_name,
        slug: slugifyName(request.institution_name ?? request.full_name),
      },
    });

    const account = await this.db.account.create({
      data: {
        org_id: organization.id,
        email: loginEmail,
        password: hashedPassword,
        role: 'admin' as any,
        status: 'active' as any,
        profile: {
          create: {
            full_name: request.full_name,
            personal_email: request.email,
          },
        },
      },
      include: { profile: true },
    });

    await this.db.organization.update({
      where: { id: organization.id },
      data: { admin_account_id: account.id },
    });

    await this.repo.markReviewed(id, 'approved', reviewedBy);

    // Send credentials immediately while the plaintext password is in memory.
    // Sent to the applicant's Gmail but shows the generated login email.
    await this.mailService.sendCredentialsEmail(
      request.email,
      account.email,
      password,
    );

    return {
      email: account.email,
      fullName: account.profile?.full_name ?? '',
      password,
      orgId: organization.id,
    };
  }

  async reject(id: string, reviewedBy: string, dto: RejectRequestDto) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    await this.repo.markReviewed(id, 'rejected', reviewedBy);

    // Notify the applicant at their Gmail; reason is included when provided.
    await this.mailService.sendRejectionEmail(request.email, dto.reason);

    return { message: 'Request rejected', reason: dto.reason ?? null };
  }

  async requestRevision(
    id: string,
    reviewedBy: string,
    dto: RequestRevisionDto,
  ) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    const unknownFields = Object.keys(dto.fieldNotes ?? {}).filter(
      (field) => !REQUEST_FIELDS.has(field),
    );
    if (unknownFields.length > 0) {
      throw new BadRequestException(
        `Unknown field name(s): ${unknownFields.join(', ')}`,
      );
    }

    await this.repo.markRequestRevision(id, dto.fieldNotes, reviewedBy);

    // Notify the applicant at their Gmail, listing every flagged field + note.
    await this.mailService.sendRevisionNeededEmail(request.email, dto.fieldNotes);

    return { message: 'Revision requested' };
  }

  async sendCredentials(id: string) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'approved') {
      throw new BadRequestException(
        'Cannot send credentials for a non-approved request',
      );
    }

    throw new BadRequestException(
      'Credentials were already sent at approval time. The password cannot be resent as it is not stored in plaintext.',
    );
  }
}