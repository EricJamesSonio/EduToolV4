// @/modules/student/student.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class StudentRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    email: string;
    hashedPassword: string;
    status: string;
    fullName: string;
    studentId: string;
    levelId: string;
    sectionId?: string;
  }) {
    return this.db.account.create({
      data: {
        org_id: data.orgId,
        email: data.email,
        password: data.hashedPassword,
        role: 'student',
        status: data.status as any,
        profile: {
          create: {
            full_name: data.fullName,
            metadata: {
              studentId: data.studentId,
              levelId: data.levelId,
              sectionId: data.sectionId ?? null,
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
      levelId?: string;
      sectionId?: string;
    },
  ) {
    return this.db.account.findMany({
      where: {
        org_id: orgId,
        role: 'student',
        deleted_at: null,
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.search
          ? {
              OR: [
                {
                  profile: {
                    full_name: {
                      contains: filters.search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  profile: {
                    metadata: {
                      path: ['studentId'],
                      string_contains: filters.search,
                    },
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
      where: { id, org_id: orgId, role: 'student', deleted_at: null },
      include: { profile: true },
    });
  }

  async findByEmail(email: string, orgId: string) {
    return this.db.account.findFirst({
      where: { email, org_id: orgId, deleted_at: null },
    });
  }

  async findByStudentId(studentId: string, orgId: string) {
    // studentId is stored in profile.metadata — filter in app layer after fetch
    // Full JSON path query for uniqueness check
    return this.db.profile.findFirst({
      where: {
        metadata: {
          path: ['studentId'],
          equals: studentId,
        },
        account: {
          org_id: orgId,
          deleted_at: null,
        },
      },
      include: { account: true },
    });
  }

  async updateProfile(
    accountId: string,
    data: {
      fullName?: string;
      email?: string;
      levelId?: string;
      sectionId?: string;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.email) {
        await tx.account.update({
          where: { id: accountId },
          data: { email: data.email },
        });
      }

      // Build metadata patch
      const current = await tx.profile.findUnique({
        where: { account_id: accountId },
        select: { metadata: true, full_name: true },
      });

      const currentMeta = (current?.metadata as Record<string, any>) ?? {};

      await tx.profile.update({
        where: { account_id: accountId },
        data: {
          ...(data.fullName ? { full_name: data.fullName } : {}),
          metadata: {
            ...currentMeta,
            ...(data.levelId !== undefined ? { levelId: data.levelId } : {}),
            ...(data.sectionId !== undefined
              ? { sectionId: data.sectionId }
              : {}),
          },
        },
      });

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
   * Fetch all active students in the org for credentials CSV export.
   * Returns accounts with their profiles.
   */
  async findAllForExport(orgId: string) {
    return this.db.account.findMany({
      where: { org_id: orgId, role: 'student', deleted_at: null },
      include: { profile: true },
      orderBy: { created_at: 'asc' },
    });
  }
}