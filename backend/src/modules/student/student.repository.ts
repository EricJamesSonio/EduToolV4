// backend/src/modules/student/student.repository.ts

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
    levelId?: string;
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
    personal_email?: string | null;
    levelId?: string;
    sectionId?: string;
  },
) {
  return this.db.$transaction(async (tx) => {
    // Update account email if provided
    if (data.email) {
      await tx.account.update({
        where: { id: accountId },
        data: { email: data.email },
      });
    }

    // Get current profile metadata
    const current = await tx.profile.findUnique({
      where: { account_id: accountId },
      select: { metadata: true, full_name: true, personal_email: true },
    });

    const currentMeta =
      current?.metadata &&
      typeof current.metadata === 'object' &&
      !Array.isArray(current.metadata)
        ? (current.metadata as Record<string, any>)
        : {};

    // Update profile
    await tx.profile.update({
      where: { account_id: accountId },
      data: {
        ...(data.fullName ? { full_name: data.fullName } : {}),
        ...(data.personal_email !== undefined
          ? { personal_email: data.personal_email ?? null }
          : {}),
        metadata: {
          ...currentMeta,
          ...(data.levelId !== undefined ? { levelId: data.levelId } : {}),
          ...(data.sectionId !== undefined ? { sectionId: data.sectionId } : {}),
        },
      },
    });

    // Return updated account with profile
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

  async findAllForExport(orgId: string) {
    return this.db.account.findMany({
      where: { org_id: orgId, role: 'student', deleted_at: null },
      include: { profile: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async findEnrollments(studentId: string, orgId: string) {
    return this.db.enrollment.findMany({
      where: {
        student_id: studentId,
        org_id: orgId,
        status: { not: 'removed' },
        class: { deleted_at: null },
      },
      include: {
        class: { include: { schedules: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findEnrollmentById(id: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async removeEnrollment(enrollmentId: string) {
    return this.db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'removed' as any },
    });
  }

  /**
   * Returns the subset of emails (from the given list) that already exist in the org.
   * Used for batch duplicate checking during bulk import.
   */
  async findEmailsInBatch(emails: string[], orgId: string): Promise<string[]> {
    if (emails.length === 0) return [];

    const accounts = await this.db.account.findMany({
      where: {
        email: { in: emails },
        org_id: orgId,
        deleted_at: null,
      },
      select: { email: true },
    });

    return accounts.map((a) => a.email);
  }

  /**
   * Returns the subset of studentIds (from the given list) that already exist in the org.
   * Pulls all profiles and filters in JS — Prisma Json path filter does not support `in`.
   */
  async findStudentIdsInBatch(
    studentIds: string[],
    orgId: string,
  ): Promise<string[]> {
    if (studentIds.length === 0) return [];

    const profiles = await this.db.profile.findMany({
      where: {
        account: { org_id: orgId, deleted_at: null },
      },
      select: { metadata: true },
    });

    const existingSet = new Set(
      profiles
        .map((p) => {
          const meta = p.metadata as Record<string, unknown> | null;
          return typeof meta?.['studentId'] === 'string'
            ? meta['studentId']
            : null;
        })
        .filter((id): id is string => id !== null),
    );

    return studentIds.filter((id) => existingSet.has(id));
  }
}