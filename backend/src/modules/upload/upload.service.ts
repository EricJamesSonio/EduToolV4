import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class UploadService {
  constructor(private readonly db: DatabaseService) {}

  async saveProfileImage(
    accountId: string,
    relativePath: string,
  ): Promise<string> {
    const profile = await this.db.profile.findUnique({
      where: { account_id: accountId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.db.profile.update({
      where: { account_id: accountId },
      data: { profile_image: relativePath },
    });

    return relativePath;
  }

  async getProfileImage(accountId: string): Promise<string | null> {
    const profile = await this.db.profile.findUnique({
      where: { account_id: accountId },
      select: { profile_image: true },
    });

    return profile?.profile_image ?? null;
  }

  async saveOrganizationLogo(
    orgId: string,
    relativePath: string,
  ): Promise<string> {
    const org = await this.db.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    await this.db.organization.update({
      where: { id: orgId },
      data: { logo_url: relativePath },
    });

    return relativePath;
  }
}
