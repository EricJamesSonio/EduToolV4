import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { SchoolYearStatus } from '@prisma/client'

@Injectable()
export class SchoolYearRepository {
  constructor(private readonly db: DatabaseService) {}

  findAll(orgId: string) {
    return this.db.schoolYear.findMany({
      where: { org_id: orgId },
      orderBy: { name: 'asc' },
    })
  }

  findById(id: string, orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { id, org_id: orgId },
    })
  }

  findActive(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: SchoolYearStatus.active },
    })
  }

  // Used by scheduler: find all school years whose end_date has passed and are still active
  findExpired() {
    return this.db.schoolYear.findMany({
      where: {
        status: SchoolYearStatus.active,
        end_date: { lte: new Date() },
      },
    })
  }

  create(orgId: string, data: { name: string; start_date?: string; end_date?: string }) {
    return this.db.schoolYear.create({
      data: {
        org_id:     orgId,
        name:       data.name,
        status:     SchoolYearStatus.pending,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date:   data.end_date   ? new Date(data.end_date)   : null,
      },
    })
  }

  update(id: string, data: { name?: string; start_date?: string; end_date?: string }) {
    return this.db.schoolYear.update({
      where: { id },
      data: {
        ...(data.name       !== undefined && { name: data.name }),
        ...(data.start_date !== undefined && { start_date: new Date(data.start_date) }),
        ...(data.end_date   !== undefined && { end_date:   new Date(data.end_date)   }),
      },
    })
  }

  activate(id: string) {
    return this.db.schoolYear.update({
      where: { id },
      data: { status: SchoolYearStatus.active },
    })
  }

  end(id: string) {
    return this.db.schoolYear.update({
      where: { id },
      data: { status: SchoolYearStatus.ended },
    })
  }

  // Bulk-end multiple school years (used by scheduler)
  endMany(ids: string[]) {
    return this.db.schoolYear.updateMany({
      where: { id: { in: ids } },
      data: { status: SchoolYearStatus.ended },
    })
  }

  /**
   * Find the currently active school year for the org.
   * There should only ever be one — enforced at service level.
   */

  /**
   * Count how many active school years exist for the org.
   * Used to guard against activating a second one simultaneously.
   */
  async countActive(orgId: string): Promise<number> {
    return this.db.schoolYear.count({
      where: { org_id: orgId, status: 'active' },
    });
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'ended') {
    return this.db.schoolYear.update({
      where: { id },
      data: { status },
    });
  }

  async updateName(id: string, name: string) {
    return this.db.schoolYear.update({
      where: { id },
      data: { name },
    });
  }
}