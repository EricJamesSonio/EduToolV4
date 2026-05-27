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
        profile: {
          create: {
            full_name: dto.fullName ?? dto.email,
            metadata: Prisma.JsonNull, // ✅ correct null for Json field
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        profile: {          // ✅ explicitly select profile here, not via spread
          select: { full_name: true },
        },
      },
    });

    await this.logAction('platform_owner', 'CREATE_ADMIN', 'account', admin.id);

    return {
      ...admin,
      fullName: admin.profile?.full_name ?? null,
      password: rawPassword,
    };
  }

  // ─── GET ADMINS (paginated + searchable) ──────────────────────────────────

async getAdmins(query: GetAdminsDto) {
  const { search, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AccountWhereInput = {
    role: 'admin',
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { profile: { full_name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [accounts, total] = await Promise.all([
    this.db.account.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        profile: {
          select: { full_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    this.db.account.count({ where }),
  ]);

  // normalize to camelCase to match frontend types
  const data = accounts.map((a) => ({
    id: a.id,
    email: a.email,
    role: a.role,
    status: a.status,
    createdAt: a.created_at,
    fullName: a.profile?.full_name ?? null,
  }));

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
    const account = await this.db.account.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        profile: {
          select: { full_name: true },
        },
      },
    });

    if (!account || account.role !== 'admin') {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: account.id,
      email: account.email,
      role: account.role,
      status: account.status,
      createdAt: account.created_at,
      fullName: account.profile?.full_name ?? null,
    };
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

async getSchools(query: { search?: string; page?: number; limit?: number }) {
  const { search } = query;
  const pageNum = Number(query.page ?? 1);
  const limitNum = Number(query.limit ?? 20);
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.OrganizationWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email_extension: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [orgs, total] = await Promise.all([
    this.db.organization.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limitNum,
      include: {
        accounts: {
          where: { role: 'admin', deleted_at: null },
          select: {
            id: true,
            email: true,
            status: true,
            profile: { select: { full_name: true } },
          },
          take: 1,
        },
      },
    }),
    this.db.organization.count({ where }),
  ]);

  const data = orgs.map((org) => {
    const admin = org.accounts[0] ?? null;
    return {
      id: org.id,
      name: org.name,
      description: org.description ?? null,
      emailExtension: org.email_extension ?? null,
      admin: admin
        ? {
            id: admin.id,
            email: admin.email,
            status: admin.status,
            fullName: admin.profile?.full_name ?? null,
          }
        : null,
    };
  });

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}
}