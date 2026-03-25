// @/modules/organization/organization.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Find the org that belongs to the given admin account.
   * An admin account is linked to an org via Account.org_id.
   */
  async findByAdminId(adminId: string) {
    return this.db.organization.findFirst({
      where: {
        accounts: {
          some: { id: adminId },
        },
      },
    });
  }

  /**
   * Find org directly by its own ID (used internally after we have orgId from JWT).
   */
  async findById(orgId: string) {
    return this.db.organization.findUnique({
      where: { id: orgId },
    });
  }

  /**
   * Check whether the given admin already owns an org.
   * An admin may only have one org — enforced here.
   */
  async existsForAdmin(adminId: string): Promise<boolean> {
    const account = await this.db.account.findUnique({
      where: { id: adminId },
      select: { org_id: true },
    });
    return !!account?.org_id;
  }

  async create(data: { name: string; description?: string }) {
    return this.db.organization.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });
  }

  async update(orgId: string, data: { name?: string; description?: string }) {
    return this.db.organization.update({
      where: { id: orgId },
      data,
    });
  }

  /**
   * After creating the org, link it back to the admin's account.
   */
  async linkToAdmin(adminId: string, orgId: string) {
    return this.db.account.update({
      where: { id: adminId },
      data: { org_id: orgId },
    });
  }
}