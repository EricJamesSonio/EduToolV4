import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { hashPassword } from '@/commons/utils/hash.util';
import { DatabaseService } from '@/core/database/database.provider';
import { PlatformRegistrationRepository } from './platform-registration.repository';
import { MailService } from '@/modules/mail/mail.service';
import { ApproveRequestDto } from './dto/approve-request.dto';

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

  async approve(id: string, dto: ApproveRequestDto) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Request is already ${request.status}`,
      );
    }

    const email = dto.adminEmail ?? request.email;

    const existing = await this.db.account.findFirst({
      where: { email, deleted_at: null },
    });
    if (existing) {
      throw new BadRequestException(
        `An account with email ${email} already exists`,
      );
    }

    const password = crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashedPassword = await hashPassword(password);

    const account = await this.db.account.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin' as any,
        status: 'active' as any,
        profile: {
          create: { full_name: request.full_name },
        },
      },
      include: { profile: true },
    });

    await this.repo.updateStatus(id, 'approved');

    return {
      email: account.email,
      fullName: account.profile?.full_name ?? '',
      password,
    };
  }

  async reject(id: string) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Request is already ${request.status}`,
      );
    }

    await this.repo.updateStatus(id, 'rejected');

    return { message: 'Request rejected' };
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

    const account = await this.db.account.findFirst({
      where: { email: request.email, deleted_at: null },
      include: { profile: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found for this request');
    }

    await this.mailService.sendCredentialsEmail(
      account.email,
      'Password was set during account creation',
    );

    return { message: 'Credentials email sent' };
  }
}
