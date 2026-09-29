// @/modules/registrar/registrar.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RegistrarRepository } from './registrar.repository';
import {
  CreateRegistrarDto,
  QueryRegistrarDto,
  UpdateRegistrarStatusDto,
} from './dto/registrar.dto';
import { generateSystemPassword } from './registrar.utils';
import { hashPassword } from '@/commons/utils/hash.util';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class RegistrarService {
  constructor(
    private readonly registrarRepository: RegistrarRepository,
    private readonly organizationService: OrganizationService,
  ) {}

  // ── POST /registrars ─────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateRegistrarDto) {
    const email = await this.buildOrgEmail(orgId, dto.username);

    const existing = await this.registrarRepository.findByEmail(email, orgId);
    if (existing) {
      throw new ConflictException(
        'An account with this username already exists in the organization.',
      );
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const account = await this.registrarRepository.create({
      orgId,
      email,
      hashedPassword,
      username: dto.username,
      fullName: dto.fullName,
    });

    return {
      id: account.id,
      orgId: account.org_id,
      email: account.email,
      status: account.status,
      username: dto.username,
      fullName: account.profile?.full_name ?? dto.username,
      plainPassword,
      createdAt: account.created_at,
    };
  }

  // ── GET /registrars ──────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryRegistrarDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.registrarRepository.findAll(orgId, {
      search: query.search,
      status: query.status,
      page,
      limit,
    });

    return {
      data: data.map((a) => this.formatAccount(a)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── PATCH /registrars/:id/status ──────────────────────────────────────────────

  async updateStatus(id: string, orgId: string, dto: UpdateRegistrarStatusDto) {
    const account = await this.registrarRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Registrar not found.');
    }

    const updated = await this.registrarRepository.updateStatus(id, dto.status);
    return this.formatAccount(updated);
  }

  // ── DELETE /registrars/:id ───────────────────────────────────────────────────

  async remove(id: string, orgId: string) {
    const account = await this.registrarRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Registrar not found.');
    }

    await this.registrarRepository.softDelete(id);
  }

  // ── POST /registrars/:id/reset-password ──────────────────────────────────────

  async resetPassword(id: string, orgId: string) {
    const account = await this.registrarRepository.findById(id, orgId);
    if (!account) {
      throw new NotFoundException('Registrar not found.');
    }

    const plainPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(plainPassword);

    await this.registrarRepository.updatePassword(id, hashedPassword);

    return { id, plainPassword };
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  /**
   * Builds an org-scoped email for a registrar using the org email extension.
   * Registrars always get a `registrar.` prefix immediately after the "@",
   * followed by the org's extension in full (e.g. registrar.pinkwell-academy,
   * or registrar.pinkwell-academy.com if the extension includes a TLD).
   * This keeps registrar accounts distinct from student/educator accounts,
   * which get the equivalent `student.`/`educator.` prefix instead.
   */
  private async buildOrgEmail(orgId: string, username: string) {
    const org = await this.organizationService.getOwn(orgId);
    const extension = org?.emailExtension?.trim();
    if (!extension) {
      throw new BadRequestException(
        'Set the organization email extension before creating registrar accounts.',
      );
    }

    const localPart = username.trim().replace(/^@+/, '').toLowerCase();
    if (!localPart || localPart.includes('@')) {
      throw new BadRequestException(
        'Username must not include an email extension.',
      );
    }
    if (!/^[a-z0-9]+$/.test(localPart)) {
      throw new BadRequestException('Username must be alphanumeric only.');
    }
    if (localPart.length > 30) {
      throw new BadRequestException('Username must be at most 30 characters.');
    }

    // Strip any pre-existing role segment (defensive, in case the stored
    // extension was ever saved with one baked in) before re-prefixing.
    const base = extension
      .replace(/^@/, '')
      .replace(/^(student|educator|registrar)\./, '')
      .replace(/\.(student|educator|registrar)\./g, '.')
      .trim();

    // Role segment always goes first, immediately after "@", with the full
    // base (including any TLD) kept intact afterward.
    const domain = `registrar.${base}`;

    return `${localPart}@${domain}`.toLowerCase();
  }

  private formatAccount(account: any) {
    const meta = account.profile?.metadata as Record<string, any> | null;
    return {
      id: account.id,
      orgId: account.org_id,
      email: account.email,
      status: account.status,
      username: meta?.registrarUsername ?? account.profile?.full_name ?? null,
      fullName: account.profile?.full_name ?? null,
      createdAt: account.created_at,
    };
  }
}