import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  ProgramEnrollmentStatus,
  SchoolYearEnrollmentStatus,
} from '@prisma/client';

export interface UpdateProfileData {
  fullName?: string;
  personalEmail?: string | null;
  profileImage?: string;
}

@Injectable()
export class ProfileRepository {
  constructor(private readonly db: DatabaseService) {}

async findCurrentProgramEnrollments(accountId: string) {
  return this.db.studentProgramEnrollment.findMany({
    where: {
      status: ProgramEnrollmentStatus.active,
      studentSchoolYear: {
        student_id: accountId,
        status: SchoolYearEnrollmentStatus.active,
      },
    },
    include: {
      program: { select: { type: true } },
      level: { select: { name: true } },
      course: { select: { code: true, name: true } },
      strand: { select: { name: true } },
      section: { select: { name: true } },
    },
    orderBy: { enrolled_at: 'desc' },
  });
}
  async updatePersonalEmail(accountId: string, personalEmail: string | null) {
    return this.db.profile.update({
      where: { account_id: accountId },
      data: { personal_email: personalEmail },
    });
  }

  async updateProfile(accountId: string, data: UpdateProfileData) {
    return this.db.profile.update({
      where: { account_id: accountId },
      data: {
        ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
        ...(data.personalEmail !== undefined
          ? { personal_email: data.personalEmail ?? null }
          : {}),
        ...(data.profileImage !== undefined
          ? { profile_image: data.profileImage }
          : {}),
      },
    });
  }

  async findByAccountId(accountId: string) {
    return this.db.profile.findUnique({
      where: { account_id: accountId },
    });
  }

  async findAccountWithProfile(accountId: string) {
    return this.db.account.findUnique({
      where: { id: accountId },
      include: { profile: true },
    });
  }
}
