// @/modules/educator/educator.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EducatorRepository } from './educator.repository';
import {
  CreateEducatorDto,
  QueryEducatorDto,
  UpdateEducatorDto,
  UpdateEducatorStatusDto,
} from './dto/educator.dto';
import { generateEducatorId, generateSystemPassword } from './educator.utils';
import { hashPassword } from '@/commons/utils/hash.util';
import { ClassService } from '../class/class.service';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class EducatorService {
  constructor(
    private readonly educatorRepository: EducatorRepository,
    private readonly classService: ClassService,
    private readonly organizationService: OrganizationService,
  ) { }

  // ── POST /educators ─────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateEducatorDto) {
    const email = await this.buildOrgEmail(orgId, dto.emailName);
    // Guard: email must be unique within the org
    const existing = await this.educatorRepository.findByEmail(email, orgId);
    if (existing) {
      throw new ConflictException(
        'An account with this email already exists in the organization.',
      );
    }

    const educatorId = generateEducatorId();
    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const account = await this.educatorRepository.create({
      orgId,
      email,
      hashedPassword,
      fullName: dto.fullName,
      educatorId,
    });

    // Return plain password once — Admin distributes this to the educator
    return {
      id: account.id,
      orgId: account.org_id,
      email: account.email,
      status: account.status,
      fullName: account.profile?.full_name,
      educatorId,
      plainPassword, // only returned on creation
      createdAt: account.created_at,
    };
  }

  // ── GET /educators ──────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryEducatorDto) {
    const accounts = await this.educatorRepository.findAll(orgId, {
      search: query.search,
      status: query.status,
    });
    return accounts.map((a) => this.formatAccount(a));
  }

  private async buildOrgEmail(orgId: string, emailName: string) {
    const org = await this.organizationService.getOwn(orgId);
    const extension = org?.emailExtension?.trim();
    if (!extension) {
      throw new BadRequestException(
        'Set the organization email extension before creating educator accounts.',
      );
    }

    const localPart = emailName.trim().replace(/^@+/, '');
    if (!localPart || localPart.includes('@')) {
      throw new BadRequestException('Email name must not include an email extension.');
    }

    return `${localPart}${extension.startsWith('@') ? extension : `@${extension}`}`.toLowerCase();
  }

  // ── GET /educators/:id ──────────────────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const account = await this.educatorRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Educator not found.');
    }

    return this.formatAccount(account);
  }

  // ── PATCH /educators/:id ────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateEducatorDto) {
    const account = await this.educatorRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Educator not found.');
    }

    let email = account.email;
    if (dto.email) {
      email = dto.email;
    }

    // Guard: new email must be unique within org
    if (email && email !== account.email) {
      const emailTaken = await this.educatorRepository.findByEmail(email, orgId);
      if (emailTaken) {
        throw new ConflictException(
          'An account with this email already exists in the organization.',
        );
      }
    }

    const updated = await this.educatorRepository.updateProfile(id, {
      fullName:     dto.fullName,
      email,
      profileImage: dto.profileImage,
    });

    return this.formatAccount(updated);
  }

  async updateStatus(id: string, orgId: string, dto: UpdateEducatorStatusDto) {
    const account = await this.educatorRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Educator not found.');
    }

    const updated = await this.educatorRepository.updateStatus(id, dto.status);
    return this.formatAccount(updated);
  }

  /**
   * Soft deletes the educator account.
   * Phase 3: will check classService.hasActiveClasses(id) before allowing delete.
   * For now, deletion proceeds without that check.
   */
  async remove(id: string, orgId: string) {
    const account = await this.educatorRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Educator not found.');
    }

    // Phase 3 hook: check for active classes
    const hasClasses = await this.classService.hasActiveClasses(id, orgId);
    if (hasClasses) throw new ConflictException('Reassign all active classes first.');

    await this.educatorRepository.softDelete(id);
  }

  // ── POST /educators/:id/reset-password ──────────────────────────────────────

  async resetPassword(id: string, orgId: string) {
    const account = await this.educatorRepository.findById(id, orgId);

    if (!account) {
      throw new NotFoundException('Educator not found.');
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    await this.educatorRepository.updatePassword(id, hashedPassword);

    // Return plain password once — Admin distributes to educator
    return {
      id,
      plainPassword,
    };
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  private formatAccount(account: any) {
    const meta = account.profile?.metadata as Record<string, any> | null;
    return {
      id: account.id,
      orgId: account.org_id,
      email: account.email,
      status: account.status,
      fullName: account.profile?.full_name ?? null,
      educatorId: meta?.educatorId ?? null,
      createdAt: account.created_at,
      personalEmail: (account.profile?.personal_email ?? null) as string | null,
      profileImage: account.profile?.profile_image ?? null,
    };
  }
}
