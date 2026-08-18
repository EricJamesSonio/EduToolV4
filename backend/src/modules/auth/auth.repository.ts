// @/modules/auth/auth.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { OtpPurpose, Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

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

  /**
   * Finds an admin Account whose profile.personal_email matches the given
   * personal Gmail (case-insensitive). The login email is system-generated and
   * decoupled from the personal Gmail, so we must match on the profile's
   * personal_email — the record, not the (possibly changed) login email.
   */
  async findAdminAccountByPersonalEmail(email: string) {
    return this.db.account.findFirst({
      where: {
        role: 'admin',
        deleted_at: null,
        profile: {
          personal_email: { equals: email, mode: 'insensitive' },
        },
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
    purpose?: OtpPurpose;
    org_id?: string;
  }) {
    return this.db.otp.create({ data });
  }

  async findValidOtp(
    email: string,
    code: string,
    opts?: { purpose?: OtpPurpose; orgId?: string },
  ) {
    return this.db.otp.findFirst({
      where: {
        email,
        code,
        used_at: null,
        expires_at: { gte: new Date() },
        ...(opts?.purpose ? { purpose: opts.purpose } : {}),
        ...(opts?.orgId ? { org_id: opts.orgId } : {}),
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

  async findRegistrationRequestByEmail(email: string) {
    return this.db.registrationRequest.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Creates a fresh request if none exists for this email, otherwise updates
   * the existing row in place. On any resubmission the revision flags are
   * cleared entirely and status resets to 'pending' — full re-review, matching
   * the Concern Center's auto-reopen convention.
   */
  async submitRegistrationRequest(data: {
    email: string;
    full_name: string;
    plan: string | null;
    institution_name?: string | null;
    role?: string | null;
    student_count?: string | null;
    programs_departments?: string | null;
  }) {
    const existing = await this.findRegistrationRequestByEmail(data.email);

    if (existing) {
      return this.db.registrationRequest.update({
        where: { id: existing.id },
        data: {
          full_name: data.full_name,
          plan: data.plan,
          institution_name: data.institution_name ?? null,
          role: data.role ?? null,
          student_count: data.student_count ?? null,
          programs_departments: data.programs_departments ?? null,
          status: 'pending' as any,
          revision_notes: Prisma.JsonNull,
          reviewed_by: null,
          reviewed_at: null,
        },
      });
    }

    return this.db.registrationRequest.create({
      data: {
        email: data.email,
        full_name: data.full_name,
        plan: data.plan,
        institution_name: data.institution_name ?? null,
        role: data.role ?? null,
        student_count: data.student_count ?? null,
        programs_departments: data.programs_departments ?? null,
      },
    });
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
