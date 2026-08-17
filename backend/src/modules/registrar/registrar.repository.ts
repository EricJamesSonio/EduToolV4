// @/modules/registrar/registrar.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class RegistrarRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    email: string;
    hashedPassword: string;
    username: string;
    fullName?: string;
  }) {
    return this.db.account.create({
      data: {
        org_id: data.orgId,
        email: data.email,
        password: data.hashedPassword,
        role: 'admin',
        status: 'active',
        is_registrar: true,
        profile: {
          create: {
            full_name: data.fullName?.trim() || data.username,
            metadata: {
              registrarUsername: data.username,
            },
          },
        },
      },
      include: { profile: true },
    });
  }

  async findAll(
    orgId: string,
    filters: { search?: string; status?: string; page?: number; limit?: number },
  ) {
    const { search, status, page = 1, limit = 20 } = filters;

    const where: Prisma.AccountWhereInput = {
      org_id: orgId,
      role: 'admin',
      is_registrar: true,
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
                  metadata: {
                    path: ['registrarUsername'],
                    string_contains: search,
                  },
                },
              },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.db.account.findMany({
        where,
        include: { profile: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.account.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, orgId: string) {
    return this.db.account.findFirst({
      where: { id, org_id: orgId, role: 'admin', is_registrar: true, deleted_at: null },
      include: { profile: true },
    });
  }

  async findByEmail(email: string, orgId: string) {
    return this.db.account.findFirst({
      where: { email, org_id: orgId, role: 'admin', is_registrar: true, deleted_at: null },
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

  /** Soft delete — sets deleted_at on the Account row. */
  async softDelete(accountId: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { deleted_at: new Date() },
    });
  }
}