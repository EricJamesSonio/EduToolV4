// src/modules/academic-calendar/academic-calendar.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AcademicCalendarRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    schoolYearId: string;
    title: string;
    type: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  }) {
    return this.db.academicCalendar.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        title: data.title,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
        description: data.description ?? null,
      },
    });
  }

  async findAll(orgId: string, schoolYearId?: string) {
    return this.db.academicCalendar.findMany({
      where: {
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      orderBy: { start_date: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.academicCalendar.findFirst({
      where: { id, org_id: orgId },
    });
  }

  /**
   * Find all holiday and no-class-day events for a school year.
   * Used by class session generation in Phase 3 to skip affected dates.
   */
  async findSessionBlockingEvents(orgId: string, schoolYearId: string) {
    return this.db.academicCalendar.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        type: { in: ['holiday', 'no_class_day'] },
      },
      orderBy: { start_date: 'asc' },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      description?: string;
    },
  ) {
    return this.db.academicCalendar.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.startDate !== undefined ? { start_date: data.startDate } : {}),
        ...(data.endDate !== undefined ? { end_date: data.endDate } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.db.academicCalendar.delete({ where: { id } });
  }
}