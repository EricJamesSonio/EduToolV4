import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      search?:       string;
      status?:       string;
      schoolYearId?: string;
      programId?:    string;
      courseId?:     string;
      strandId?:     string;
      levelId?:      string;
      sectionId?:    string;
    },
  ) {
    const { search, status, schoolYearId, programId, courseId, strandId, levelId, sectionId } = filters;

    const hasHierarchyFilter = schoolYearId || programId || courseId || strandId || levelId || sectionId;

    // Account has no Prisma relation to StudentSchoolYear (student_id is a plain String,
    // no @relation declared on Account). We resolve matching student_ids first via a
    // two-step query, then filter Account with id IN [...].
    let matchingStudentIds: string[] | null = null;

  if (hasHierarchyFilter) {
    const matchingSSY = await this.db.studentSchoolYear.findMany({
      where: {
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
        programEnrollments: {
          some: {
            org_id: orgId,
            ...(programId  ? { program_id: programId } : {}),
            ...(courseId   ? { course_id:  courseId  } : {}),
            ...(strandId   ? { strand_id:  strandId  } : {}),
            ...(levelId    ? { level_id:   levelId   } : {}),
            ...(sectionId  ? { section_id: sectionId } : {}),
          },
        },
      },
      select: { student_id: true },
    });

    matchingStudentIds = matchingSSY.map((r) => r.student_id);

    // Fallback: if only sectionId is provided and enrollment table returned nothing,
    // check profile.metadata directly — students enrolled via simple profile update
    // are stored there instead of in StudentProgramEnrollment.
    if (
      matchingStudentIds.length === 0 &&
      sectionId &&
      !schoolYearId && !programId && !courseId && !strandId && !levelId
    ) {
      const metaMatches = await this.db.profile.findMany({
        where: {
          metadata: { path: ['sectionId'], equals: sectionId },
          account: { org_id: orgId, role: 'student', deleted_at: null },
        },
        select: { account_id: true },
      });

      matchingStudentIds = metaMatches.map((r) => r.account_id);
    }

    if (matchingStudentIds.length === 0) return [];
  }

    return this.db.account.findMany({
      where: {
        org_id:     orgId,
        role:       'student',
        deleted_at: null,
        ...(matchingStudentIds !== null ? { id: { in: matchingStudentIds } } : {}),
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { profile: { full_name: { contains: search, mode: 'insensitive' } } },
                { profile: { metadata: { path: ['studentId'], string_contains: search } } },
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
        metadata: { path: ['studentId'], equals: studentId },
        account: { org_id: orgId, deleted_at: null },
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
      profileImage?: string;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.email) {
        await tx.account.update({ where: { id: accountId }, data: { email: data.email } });
      }

      const current = await tx.profile.findUnique({
        where: { account_id: accountId },
        select: { metadata: true, full_name: true, personal_email: true },
      });

      const currentMeta =
        current?.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
          ? (current.metadata as Record<string, any>)
          : {};

      await tx.profile.update({
        where: { account_id: accountId },
        data: {
          ...(data.fullName ? { full_name: data.fullName } : {}),
          ...(data.personal_email !== undefined ? { personal_email: data.personal_email ?? null } : {}),
          ...(data.profileImage !== undefined ? { profile_image: data.profileImage } : {}),
          metadata: {
            ...currentMeta,
            ...(data.levelId   !== undefined ? { levelId:   data.levelId   } : {}),
            ...(data.sectionId !== undefined ? { sectionId: data.sectionId } : {}),
          },
        },
      });

      return tx.account.findUnique({ where: { id: accountId }, include: { profile: true } });
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
      include: { class: { include: { schedules: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async findEnrollmentById(id: string, orgId: string) {
    return this.db.enrollment.findFirst({ where: { id, org_id: orgId } });
  }

  async removeEnrollment(enrollmentId: string) {
    return this.db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'removed' as any },
    });
  }

  async findEmailsInBatch(emails: string[], orgId: string): Promise<string[]> {
    if (emails.length === 0) return [];
    const accounts = await this.db.account.findMany({
      where: { email: { in: emails }, org_id: orgId, deleted_at: null },
      select: { email: true },
    });
    return accounts.map((a) => a.email);
  }

  async findStudentIdsInBatch(studentIds: string[], orgId: string): Promise<string[]> {
    if (studentIds.length === 0) return [];
    const profiles = await this.db.profile.findMany({
      where: { account: { org_id: orgId, deleted_at: null } },
      select: { metadata: true },
    });
    const existingSet = new Set(
      profiles
        .map((p) => {
          const meta = p.metadata as Record<string, unknown> | null;
          return typeof meta?.['studentId'] === 'string' ? meta['studentId'] : null;
        })
        .filter((id): id is string => id !== null),
    );
    return studentIds.filter((id) => existingSet.has(id));
  }
}