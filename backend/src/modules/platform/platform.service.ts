import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GetAdminsDto } from './dto/get-admins.dto';
import { hashPassword } from '@/commons/utils/hash.util';
import { generatePassword } from '@/commons/utils/password.util';

const ADMIN_SAFE_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  created_at: true,
} as const;

@Injectable()
export class PlatformService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  login(password: string) {
    if (!process.env.PLATFORM_SECRET_PASSWORD) {
      throw new Error('PLATFORM_SECRET_PASSWORD not set');
    }

    if (password !== process.env.PLATFORM_SECRET_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      access_token: this.jwtService.sign({ role: 'platform_owner' }),
    };
  }

  // ─── CREATE ADMIN ─────────────────────────────────────────────────────────

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.db.account.findFirst({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const rawPassword = generatePassword();
    const hashed = await hashPassword(rawPassword);

    const admin = await this.db.account.create({
      data: {
        email: dto.email,
        password: hashed,
        role: 'admin',
        status: 'active',
        org_id: null,
      },
      select: ADMIN_SAFE_SELECT,
    });

    await this.logAction('platform_owner', 'CREATE_ADMIN', 'account', admin.id);

    return {
      ...admin,
      password: rawPassword, // ⚠ one-time only, not stored
    };
  }

  // ─── GET ADMINS (paginated + searchable) ──────────────────────────────────

  async getAdmins(query: GetAdminsDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {
      role: 'admin',
      ...(search
        ? { email: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.db.account.findMany({
        where,
        select: ADMIN_SAFE_SELECT,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.db.account.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET ADMIN ────────────────────────────────────────────────────────────

  async getAdmin(id: string) {
    const admin = await this.db.account.findUnique({
      where: { id },
      select: ADMIN_SAFE_SELECT,
    });

    if (!admin || admin.role !== 'admin') {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  // ─── BLOCK ────────────────────────────────────────────────────────────────

  async blockAdmin(id: string) {
    await this.assertAdminExists(id);

    const admin = await this.db.account.update({
      where: { id },
      data: { status: 'suspended' },
      select: ADMIN_SAFE_SELECT,
    });

    await this.logAction('platform_owner', 'BLOCK_ADMIN', 'account', id);

    return admin;
  }

  // ─── UNBLOCK ──────────────────────────────────────────────────────────────

  async unblockAdmin(id: string) {
    await this.assertAdminExists(id);

    const admin = await this.db.account.update({
      where: { id },
      data: { status: 'active' },
      select: ADMIN_SAFE_SELECT,
    });

    await this.logAction('platform_owner', 'UNBLOCK_ADMIN', 'account', id);

    return admin;
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────

  async resetPassword(id: string) {
    await this.assertAdminExists(id);

    const rawPassword = generatePassword();
    const hashed = await hashPassword(rawPassword);

    const admin = await this.db.account.update({
      where: { id },
      data: { password: hashed },
      select: ADMIN_SAFE_SELECT,
    });

    await this.logAction('platform_owner', 'RESET_ADMIN_PASSWORD', 'account', id);

    return {
      ...admin,
      password: rawPassword, // ⚠ one-time only, not stored
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async assertAdminExists(id: string) {
    const admin = await this.db.account.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== 'admin') {
      throw new NotFoundException('Admin not found');
    }
  }

  private async logAction(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.db.auditLog.create({
      data: {
        org_id: 'platform',
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}