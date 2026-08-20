// @/modules/educator/educator.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class EducatorRepository {
  constructor(private readonly db: DatabaseService) {}

  private rankMatch(
    search: string,
    fullName?: string | null,
    secondaryId?: string | null,
  ): number {
    const q = search.trim().toLowerCase();
    const name = (fullName ?? '').toLowerCase();
    const sid = (secondaryId ?? '').toLowerCase();

    if (name === q || sid === q) return 0;
    if (name.startsWith(q) || sid.startsWith(q)) return 1;
    return 2;
  }

  async create(data: {
    orgId: string;
    email: string;
    hashedPassword: string;
    fullName: string;
    educatorId: string; // system-generated, stored in profile metadata
  }) {
    return this.db.account.create({
      data: {
        org_id: data.orgId,
        email: data.email,
        password: data.hashedPassword,
        role: 'educator',
        status: 'active',
        profile: {
          create: {
            full_name: data.fullName,
            metadata: {
              educatorId: data.educatorId,
            },
          },
        },
      },
      include: { profile: true },
    });
  }

  async findAll(
    orgId: string,
    filters: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { search, status, page = 1, limit = 20 } = filters;

    const where: Prisma.AccountWhereInput = {
      org_id: orgId,
      role: 'educator',
      deleted_at: null,
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              {
                profile: {
                  full_name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                profile: {
                  metadata: { path: ['educatorId'], string_contains: search },
                },
              },
            ],
          }
        : {}),
    };

    let data: any[];
    let total: number;

    if (search) {
      const allMatches = await this.db.account.findMany({
        where,
        include: { profile: true },
        take: 5000,
      });

      const ranked = allMatches
        .map((row) => {
          const meta = row.profile?.metadata as Record<string, any> | null;
          return {
            row,
            rank: this.rankMatch(
              search,
              row.profile?.full_name,
              meta?.educatorId ?? null,
            ),
          };
        })
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return (a.row.profile?.full_name ?? '').localeCompare(
            b.row.profile?.full_name ?? '',
          );
        })
        .map((r) => r.row);

      total = ranked.length;
      data = ranked.slice((page - 1) * limit, (page - 1) * limit + limit);
    } else {
      [data, total] = await Promise.all([
        this.db.account.findMany({
          where,
          include: { profile: true },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.account.count({ where }),
      ]);
    }

    return { data, total };
  }

  async findById(id: string, orgId: string) {
    return this.db.account.findFirst({
      where: { id, org_id: orgId, role: 'educator', deleted_at: null },
      include: { profile: true },
    });
  }

  async findByEmail(email: string, orgId: string) {
    return this.db.account.findFirst({
      where: { email, org_id: orgId, role: 'educator', deleted_at: null },
    });
  }

  async findEmailsInBatch(emails: string[], orgId: string): Promise<string[]> {
    const results = await this.db.account.findMany({
      where: {
        email: { in: emails },
        org_id: orgId,
        role: 'educator',
        deleted_at: null,
      },
      select: { email: true },
    });
    return results.map((r) => r.email);
  }

  async updateProfile(
    accountId: string,
    data: { fullName?: string; email?: string; profileImage?: string },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.email) {
        await tx.account.update({
          where: { id: accountId },
          data: { email: data.email },
        });
      }

      const updateData: Record<string, any> = {};
      if (data.fullName) updateData.full_name = data.fullName;
      if (data.profileImage !== undefined)
        updateData.profile_image = data.profileImage;

      if (Object.keys(updateData).length > 0) {
        await tx.profile.update({
          where: { account_id: accountId },
          data: updateData,
        });
      }

      return tx.account.findUnique({
        where: { id: accountId },
        include: { profile: true },
      });
    });
  }

  async updateStatus(accountId: string, status: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { status: status as any },
      include: { profile: true },
    });
  }

  async updatePassword(accountId: string, hashedPassword: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Soft delete — sets deleted_at on the Account row.
   * Profile is preserved for historical reference.
   */
  async softDelete(accountId: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { deleted_at: new Date() },
    });
  }
}
