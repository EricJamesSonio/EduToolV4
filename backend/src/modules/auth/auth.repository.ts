// @/modules/auth/auth.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) { }

  /**
   * Find an account by email (optionally scoped to an org).
   * Used during login to locate the account regardless of org.
   */
  async findAccountByEmail(email: string) {
    return this.db.account.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Find an account by its primary key.
   * Used to hydrate the JWT payload back into a full user object.
   */
  async findAccountById(id: string) {
    return this.db.account.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Persist a hashed refresh token against the account.
   * We store it on the profile metadata to avoid schema changes,
   * but you could add a dedicated column if preferred.
   */
  async saveRefreshToken(accountId: string, hashedToken: string) {
    return this.db.profile.upsert({
      where: { account_id: accountId },
      update: {
        metadata: { refreshToken: hashedToken },
      },
      create: {
        account_id: accountId,
        full_name: '',
        metadata: { refreshToken: hashedToken },
      },
    });
  }

  /**
   * Retrieve the stored hashed refresh token for an account.
   */
  async getRefreshToken(accountId: string): Promise<string | null> {
    const profile = await this.db.profile.findUnique({
      where: { account_id: accountId },
      select: { metadata: true },
    });

    if (!profile?.metadata) return null;

    const meta = profile.metadata as Record<string, any>;
    return meta.refreshToken ?? null;
  }

  /**
   * Clear the stored refresh token on logout.
   */
  async clearRefreshToken(accountId: string) {
    return this.db.profile.update({
      where: { account_id: accountId },
      data: {
        metadata: {
          refreshToken: null,
        },
      },
    });
  }
}