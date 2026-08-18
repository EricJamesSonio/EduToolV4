import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class PersonalEmailRegistryService {
  constructor(private readonly db: DatabaseService) {}

  async isPersonalEmailInUse(
    email: string,
    excludeAccountId?: string,
  ): Promise<boolean> {
    const existing = await this.db.profile.findFirst({
      where: {
        personal_email: email,
        ...(excludeAccountId ? { account_id: { not: excludeAccountId } } : {}),
      },
      select: { id: true },
    });
    return !!existing;
  }
}
