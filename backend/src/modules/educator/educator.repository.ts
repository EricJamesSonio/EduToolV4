// @/modules/educator/educator.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class EducatorRepository {
  constructor(private readonly db: DatabaseService) {}

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

  async findAll(orgId: string, filters: { search?: string; status?: string }) {
    const { search, status } = filters;

    return this.db.account.findMany({
      where: {
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
      },
      include: { profile: true },
      orderBy: { created_at: 'desc' },
    });
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

  async updateProfile(
    accountId: string,
    data: { fullName?: string; email?: string },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.email) {
        await tx.account.update({
          where: { id: accountId },
          data: { email: data.email },
        });
      }

      if (data.fullName) {
        await tx.profile.update({
          where: { account_id: accountId },
          data: { full_name: data.fullName },
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
