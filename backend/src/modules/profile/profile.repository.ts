import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export interface UpdateProfileData {
  fullName?: string;
  personalEmail?: string | null;
  profileImage?: string;
}

@Injectable()
export class ProfileRepository {
  constructor(private readonly db: DatabaseService) {}

  async findCurrentProgramEnrollments(accountId: string, orgId: string) {
  return this.db.studentProgramEnrollment.findMany({
    where: {
      org_id: orgId,
      status: 'active',
      studentSchoolYear: {
        student_id: accountId, // ASSUMPTION: student_id == account.id
        org_id: orgId,
        status: 'active',
      },
    },
    include: {
      program: true,
      level: true,
      course: true,
      strand: true,
      section: true,
    },
    orderBy: { created_at: 'desc' }, // ASSUMPTION: field exists
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
