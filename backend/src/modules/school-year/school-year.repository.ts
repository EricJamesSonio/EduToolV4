import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class SchoolYearRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: { orgId: string; name: string; start_date?: string; end_date?: string }) {
    return this.db.schoolYear.create({
      data: {
        org_id:     data.orgId,
        name:       data.name,
        status:     'pending',
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date:   data.end_date   ? new Date(data.end_date)   : null,
      },
    })
  }

  async findAll(orgId: string) {
    return this.db.schoolYear.findMany({
      where:   { org_id: orgId },
      orderBy: { name: 'desc' },
    })
  }

  async findById(id: string, orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { id, org_id: orgId },
    })
  }

  async findActive(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: 'active' },
    })
  }

  async countActive(orgId: string): Promise<number> {
    return this.db.schoolYear.count({
      where: { org_id: orgId, status: 'active' },
    })
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'ended') {
    return this.db.schoolYear.update({
      where: { id },
      data:  { status },
    })
  }

  async update(
    id:   string,
    data: { name?: string; start_date?: string | null; end_date?: string | null },
  ) {
    return this.db.schoolYear.update({
      where: { id },
      data: {
        ...(data.name       !== undefined && { name: data.name }),
        ...(data.start_date !== undefined && {
          start_date: data.start_date ? new Date(data.start_date) : null,
        }),
        ...(data.end_date !== undefined && {
          end_date: data.end_date ? new Date(data.end_date) : null,
        }),
      },
    })
  }

  /** Find all school years whose end_date has passed and are still active */
  async findExpiredActive(): Promise<{ id: string; org_id: string }[]> {
    return this.db.schoolYear.findMany({
      where: {
        status:   'active',
        end_date: { lt: new Date() },
      },
      select: { id: true, org_id: true },
    })
  }
}