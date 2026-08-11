import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlatformRegistrationRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMany(params: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { full_name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.db.registrationRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.db.registrationRequest.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.db.registrationRequest.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    return this.db.registrationRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async markReviewed(
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
  ) {
    return this.db.registrationRequest.update({
      where: { id },
      data: {
        status: status as any,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
      },
    });
  }

  async markRequestRevision(
    id: string,
    fieldNotes: Record<string, string>,
    reviewedBy: string,
  ) {
    return this.db.registrationRequest.update({
      where: { id },
      data: {
        status: 'needs_revision' as any,
        revision_notes: fieldNotes,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
      },
    });
  }
}
