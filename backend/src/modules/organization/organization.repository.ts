import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByAdminId(adminId: string) {
    return this.db.organization.findFirst({
      where: {
        accounts: { some: { id: adminId } },
      },
    });
  }

  async findById(orgId: string) {
    return this.db.organization.findUnique({
      where: { id: orgId },
    });
  }

  async existsForAdmin(adminId: string): Promise<boolean> {
    const account = await this.db.account.findUnique({
      where: { id: adminId },
      select: { org_id: true },
    });
    return !!account?.org_id;
  }

async create(data: { name: string; description?: string; email_extension: string }) {
  return this.db.organization.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      email_extension: data.email_extension,
    },
  });
}

async update(
  orgId: string,
  data: {
    name?: string;
    description?: string;
    email_extension?: string;   // removed `| null` — schema field is non-nullable
  },
) {
  return this.db.organization.update({
    where: { id: orgId },
    data,
  });
}

  async linkToAdmin(adminId: string, orgId: string) {
    return this.db.account.update({
      where: { id: adminId },
      data: { org_id: orgId },
    });
  }
}