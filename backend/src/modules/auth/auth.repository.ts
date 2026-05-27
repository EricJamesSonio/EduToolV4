// @/modules/auth/auth.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) { }

  async findAccountByEmail(email: string) {
    return this.db.account.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      include: {
        profile: true,
      },
    });
  }

  async findAccountById(id: string) {
    return this.db.account.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async saveRefreshToken(accountId: string, hashedToken: string) {
    return this.db.profile.upsert({
      where: { account_id: accountId },
      update: {
        metadata: { refreshToken: hashedToken },
      },
      create: {
        account_id: accountId,
        full_name: '',
        metadata: { refreshToken: hashedToken },
      },
    });
  }

  async getRefreshToken(accountId: string): Promise<string | null> {
    const profile = await this.db.profile.findUnique({
      where: { account_id: accountId },
      select: { metadata: true },
    });

    if (!profile?.metadata) return null;

    const meta = profile.metadata as Record<string, any>;
    return meta.refreshToken ?? null;
  }

  async clearRefreshToken(accountId: string) {
    return this.db.profile.update({
      where: { account_id: accountId },
      data: {
        metadata: {
          refreshToken: null,
        },
      },
    });
  }

  // ─── OTP ───────────────────────────────────────────────────────────────────

  async createOtp(data: {
    email: string;
    full_name?: string | null;
    code: string;
    plan: string | null;
    institution_name?: string | null;
    role?: string | null;
    student_count?: string | null;
    programs_departments?: string | null;
    expires_at: Date;
  }) {
    return this.db.otp.create({ data });
  }

  async findValidOtp(email: string, code: string) {
    return this.db.otp.findFirst({
      where: {
        email,
        code,
        used_at: null,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async markOtpUsed(id: string) {
    return this.db.otp.update({
      where: { id },
      data: { used_at: new Date() },
    });
  }

  // ─── Registration Request ──────────────────────────────────────────────────

  async createRegistrationRequest(data: {
    email: string;
    full_name: string;
    plan: string | null;
    institution_name?: string | null;
    role?: string | null;
    student_count?: string | null;
    programs_departments?: string | null;
  }) {
    return this.db.registrationRequest.create({ data });
  }

  async findRegistrationRequests(params: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { full_name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.db.registrationRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.db.registrationRequest.count({ where }),
    ]);

    return { data, total };
  }

  async updateRegistrationRequestStatus(id: string, status: string) {
    return this.db.registrationRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async findRegistrationRequestById(id: string) {
    return this.db.registrationRequest.findUnique({ where: { id } });
  }

  // ─── Account Creation ──────────────────────────────────────────────────────

  async createAccount(data: {
    email: string;
    password: string;
    full_name: string;
  }) {
    return this.db.account.create({
      data: {
        email: data.email,
        password: data.password,
        role: 'admin' as any,
        status: 'active' as any,
        profile: {
          create: { full_name: data.full_name },
        },
      },
      include: { profile: true },
    });
  }
}