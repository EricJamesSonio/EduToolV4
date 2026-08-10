import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '@/core/database/database.provider';

function slugifyName(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'org';
  return `${base}-${randomBytes(4).toString('hex')}`;
}

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

async create(data: { name: string; description?: string; address?: string; email_extension?: string }) {
  return this.db.organization.create({
    data: {
      name: data.name,
      slug: slugifyName(data.name),
      description: data.description ?? null,
      address: data.address ?? null,
      email_extension: data.email_extension ?? undefined,
    },
  });
}

async update(
  orgId: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    email_extension?: string;
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

  async findAll() {
    return this.db.organization.findMany({
      where: { admin_account_id: { not: null } },
      orderBy: { name: 'asc' },
    });
  }
}