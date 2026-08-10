// src/modules/enrollment-portal/enrollment-portal.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { EnrollmentApplicationStatus } from '@prisma/client';

export interface CreateApplicationData {
  orgId: string;
  schoolYearId: string;
  periodId: string;
  applicationCode: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  age?: number | null;
  address?: string | null;
  contactNumber?: string | null;
  lastSchoolGraduated?: string | null;
  programId: string;
  courseId?: string | null;
  strandId?: string | null;
  levelId: string;
}

@Injectable()
export class EnrollmentPortalRepository {
  constructor(private readonly db: DatabaseService) {}

  findBySlug(slug: string) {
    return this.db.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  }

  findPeriodByToken(token: string, orgId: string) {
    return this.db.enrollmentPeriod.findFirst({
      where: { token, org_id: orgId },
      include: {
        schoolYear: { select: { id: true, name: true, org_id: true } },
      },
    });
  }

  findProgramsForSchoolYear(orgId: string, schoolYearId: string) {
    return this.db.program.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      include: {
        courses: {
          where: { org_id: orgId, school_year_id: schoolYearId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            levels: {
              where: { org_id: orgId, school_year_id: schoolYearId },
              orderBy: { name: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
        strands: {
          where: { org_id: orgId, school_year_id: schoolYearId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            levels: {
              where: { org_id: orgId, school_year_id: schoolYearId },
              orderBy: { name: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
        levels: {
          where: {
            org_id: orgId,
            school_year_id: schoolYearId,
            course_id: null,
            strand_id: null,
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findProgramById(orgId: string, schoolYearId: string, programId: string) {
    return this.db.program.findFirst({
      where: { id: programId, org_id: orgId, school_year_id: schoolYearId },
      select: { id: true, type: true },
    });
  }

  findCourseById(
    orgId: string,
    schoolYearId: string,
    programId: string,
    courseId: string,
  ) {
    return this.db.course.findFirst({
      where: {
        id: courseId,
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
      },
      select: { id: true },
    });
  }

  findStrandById(
    orgId: string,
    schoolYearId: string,
    programId: string,
    strandId: string,
  ) {
    return this.db.strand.findFirst({
      where: {
        id: strandId,
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
      },
      select: { id: true },
    });
  }

  findLevelSelection(
    orgId: string,
    schoolYearId: string,
    programId: string,
    levelId: string,
  ) {
    return this.db.level.findFirst({
      where: { id: levelId, org_id: orgId, school_year_id: schoolYearId, program_id: programId },
      select: { id: true, course_id: true, strand_id: true },
    });
  }

  /**
   * True when an email can no longer be used to submit a NEW application for
   * this organization: either a previous application was already approved
   * (which materializes a student account) or a student account for that
   * personal email already exists. Checked org-wide and case-insensitively so
   * a verified applicant can never re-apply after being admitted.
   */
  async emailAlreadyCommitted(orgId: string, email: string): Promise<boolean> {
    const [approvedApp, studentAccount] = await Promise.all([
      this.db.enrollmentApplication.findFirst({
        where: {
          org_id: orgId,
          status: 'approved',
          personal_email: { equals: email, mode: 'insensitive' },
        },
        select: { id: true },
      }),
      this.db.account.findFirst({
        where: {
          org_id: orgId,
          role: 'student',
          deleted_at: null,
          profile: {
            personal_email: { equals: email, mode: 'insensitive' },
          },
        },
        select: { id: true },
      }),
    ]);

    return Boolean(approvedApp || studentAccount);
  }

  findApplicationByEmail(orgId: string, schoolYearId: string, email: string) {
    return this.db.enrollmentApplication.findFirst({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        personal_email: { equals: email, mode: 'insensitive' },
      },
    });
  }

  findApplicationById(id: string, orgId: string) {
    return this.db.enrollmentApplication.findFirst({
      where: { id, org_id: orgId },
    });
  }

  countApplicationByCode(orgId: string, schoolYearId: string, code: string) {
    return this.db.enrollmentApplication.count({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        application_code: code,
      },
    });
  }

  createApplication(data: CreateApplicationData) {
    return this.db.enrollmentApplication.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        enrollment_period_id: data.periodId,
        application_code: data.applicationCode,
        personal_email: data.email,
        first_name: data.firstName,
        middle_name: data.middleName ?? null,
        last_name: data.lastName,
        age: data.age ?? null,
        address: data.address ?? null,
        contact_number: data.contactNumber ?? null,
        last_school_graduated: data.lastSchoolGraduated ?? null,
        program_id: data.programId,
        course_id: data.courseId ?? null,
        strand_id: data.strandId ?? null,
        level_id: data.levelId,
      },
    });
  }

  updateApplication(
    id: string,
    data: {
      firstName: string;
      middleName?: string | null;
      lastName: string;
      age?: number | null;
      address?: string | null;
      contactNumber?: string | null;
      lastSchoolGraduated?: string | null;
      programId: string;
      courseId?: string | null;
      strandId?: string | null;
      levelId: string;
      status?: EnrollmentApplicationStatus;
    },
  ) {
    return this.db.enrollmentApplication.update({
      where: { id },
      data: {
        first_name: data.firstName,
        middle_name: data.middleName ?? null,
        last_name: data.lastName,
        age: data.age ?? null,
        address: data.address ?? null,
        contact_number: data.contactNumber ?? null,
        last_school_graduated: data.lastSchoolGraduated ?? null,
        program_id: data.programId,
        course_id: data.courseId ?? null,
        strand_id: data.strandId ?? null,
        level_id: data.levelId,
        ...(data.status ? { status: data.status } : {}),
      },
    });
  }

  findApplicationForLookup(code: string, email?: string) {
    return this.db.enrollmentApplication.findMany({
      where: email
        ? { application_code: code, personal_email: { equals: email, mode: 'insensitive' } }
        : { application_code: code },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        application_code: true,
        personal_email: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        status: true,
        org_id: true,
        school_year_id: true,
        program_id: true,
        level_id: true,
      },
    });
  }
}