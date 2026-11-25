// @/modules/auth/auth.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { OtpPurpose, Prisma } from '@prisma/client';

function toMetaObject(metadata: unknown): Record<string, any> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, any>)
    : {};
}

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
   * personal_email - the record, not the (possibly changed) login email.
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

  /**
   * Reads current metadata and merges the refresh token into it instead of
   * replacing the whole JSON blob.
   *
   * BUGFIX: profile.metadata also stores studentId/educatorId (and, for
   * students, levelId/sectionId) - see StudentRepository.create /
   * EducatorRepository.create. metadata is a Prisma `Json` column, and Prisma
   * REPLACES the entire JSON value on write; it does not deep-merge. The
   * previous implementation wrote `metadata: { refreshToken: hashedToken }`
   * directly, which silently wiped every other key on every login and every
   * token refresh (generateTokens() is called from both login() and
   * refresh()). Any account that had ever logged in lost its display ID
   * permanently. Read-modify-write under a transaction (same pattern already
   * used correctly in EducatorRepository.updateProfile and
   * StudentRepository.updateProfile) fixes this without touching callers.
   *
   * Every new refresh token also resets the "closing" marker and records when
   * it was issued, so a reload that refreshes the session cancels a close.
   */
  async saveRefreshToken(accountId: string, hashedToken: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.profile.findUnique({
        where: { account_id: accountId },
        select: { metadata: true },
      });

      const currentMeta = toMetaObject(current?.metadata);
      const now = Date.now();

      return tx.profile.upsert({
        where: { account_id: accountId },
        update: {
          metadata: {
            ...currentMeta,
            refreshToken: hashedToken,
            refreshIssuedAt: now,
            sessionClosingAt: null,
          },
        },
        create: {
          account_id: accountId,
          full_name: '',
          metadata: {
            refreshToken: hashedToken,
            refreshIssuedAt: now,
            sessionClosingAt: null,
          },
        },
      });
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

  /**
   * Refresh token hash plus the session-close bookkeeping used to end a
   * session shortly after the user leaves the site.
   */
  async getRefreshSession(accountId: string): Promise<{
    hash: string | null;
    closingAt: number | null;
    issuedAt: number | null;
  }> {
    const profile = await this.db.profile.findUnique({
      where: { account_id: accountId },
      select: { metadata: true },
    });

    const meta = toMetaObject(profile?.metadata);

    return {
      hash: typeof meta.refreshToken === 'string' ? meta.refreshToken : null,
      closingAt:
        typeof meta.sessionClosingAt === 'number' ? meta.sessionClosingAt : null,
      issuedAt:
        typeof meta.refreshIssuedAt === 'number' ? meta.refreshIssuedAt : null,
    };
  }

  /**
   * Marks the session as "being left". Same read-modify-write pattern as
   * saveRefreshToken so the rest of metadata is preserved.
   */
  async markSessionClosing(accountId: string, closingAt: number) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.profile.findUnique({
        where: { account_id: accountId },
        select: { metadata: true },
      });

      if (!current) return null;

      return tx.profile.update({
        where: { account_id: accountId },
        data: {
          metadata: {
            ...toMetaObject(current.metadata),
            sessionClosingAt: closingAt,
          },
        },
      });
    });
  }

  /**
   * Same read-modify-write fix as saveRefreshToken - see the comment there.
   * Logout must only clear the refresh token, not the rest of metadata.
   */
  async clearRefreshToken(accountId: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.profile.findUnique({
        where: { account_id: accountId },
        select: { metadata: true },
      });

      const currentMeta = toMetaObject(current?.metadata);

      return tx.profile.update({
        where: { account_id: accountId },
        data: {
          metadata: {
            ...currentMeta,
            refreshToken: null,
            refreshIssuedAt: null,
            sessionClosingAt: null,
          },
        },
      });
    });
  }

  // --- OTP ---------------------------------------------------------------

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

  // --- Registration Request ----------------------------------------------

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
   * cleared entirely and status resets to 'pending' - full re-review, matching
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

  // --- Account Creation --------------------------------------------------

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