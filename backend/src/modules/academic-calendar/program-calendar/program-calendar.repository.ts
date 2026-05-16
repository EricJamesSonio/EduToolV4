// backend/src/modules/academic-calendar/program-calendar.repository.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class ProgramCalendarRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Program Calendar CRUD ────────────────────────────────────────────────

  async create(data: {
    orgId:       string;
    schoolYearId: string;
    programId:   string;
    startDate:   Date;
    endDate:     Date;
    notes?:      string;
  }) {
    return this.db.programCalendar.create({
      data: {
        org_id:         data.orgId,
        school_year_id: data.schoolYearId,
        program_id:     data.programId,
        start_date:     data.startDate,
        end_date:       data.endDate,
        notes:          data.notes ?? null,
      },
      include: { breaks: true, terms: true },
    });
  }

  async findAll(orgId: string, filters: { schoolYearId?: string; programId?: string }) {
    return this.db.programCalendar.findMany({
      where: {
        org_id: orgId,
        ...(filters.schoolYearId ? { school_year_id: filters.schoolYearId } : {}),
        ...(filters.programId    ? { program_id:     filters.programId }    : {}),
      },
      include: {
        breaks: { orderBy: { order_index: 'asc' } },
        terms:  { orderBy: { order_index: 'asc' } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.programCalendar.findFirst({
      where: { id, org_id: orgId },
      include: {
        breaks: { orderBy: { order_index: 'asc' } },
        terms:  { orderBy: { order_index: 'asc' } },
      },
    });
  }

  async findByProgram(programId: string, schoolYearId: string, orgId: string) {
    return this.db.programCalendar.findFirst({
      where: { program_id: programId, school_year_id: schoolYearId, org_id: orgId },
      include: {
        breaks: { orderBy: { order_index: 'asc' } },
        terms:  { orderBy: { order_index: 'asc' } },
      },
    });
  }

  async update(id: string, data: {
    startDate?: Date;
    endDate?:   Date;
    notes?:     string | null;
  }) {
    return this.db.programCalendar.update({
      where: { id },
      data: {
        ...(data.startDate !== undefined ? { start_date: data.startDate } : {}),
        ...(data.endDate   !== undefined ? { end_date:   data.endDate }   : {}),
        ...(data.notes     !== undefined ? { notes:      data.notes }     : {}),
      },
      include: {
        breaks: { orderBy: { order_index: 'asc' } },
        terms:  { orderBy: { order_index: 'asc' } },
      },
    });
  }

  async delete(id: string) {
    // Cascade deletes breaks and terms via FK
    return this.db.programCalendar.delete({ where: { id } });
  }

  // ── Breaks ────────────────────────────────────────────────────────────────

  async replaceBreaks(
    calendarId: string,
    orgId:      string,
    breaks: Array<{ label: string; startDate: Date; endDate: Date; orderIndex: number }>,
  ) {
    await this.db.programCalendarBreak.deleteMany({ where: { calendar_id: calendarId } });

    if (breaks.length === 0) return [];

    return this.db.programCalendarBreak.createMany({
      data: breaks.map((b) => ({
        org_id:      orgId,
        calendar_id: calendarId,
        label:       b.label,
        start_date:  b.startDate,
        end_date:    b.endDate,
        order_index: b.orderIndex,
      })),
    });
  }

  // ── Terms ─────────────────────────────────────────────────────────────────

  async replaceTerms(
    calendarId: string,
    orgId:      string,
    terms: Array<{ label: string; startDate: Date; endDate: Date; orderIndex: number }>,
  ) {
    await this.db.programCalendarTerm.deleteMany({ where: { calendar_id: calendarId } });

    if (terms.length === 0) return [];

    await this.db.programCalendarTerm.createMany({
      data: terms.map((t) => ({
        org_id:      orgId,
        calendar_id: calendarId,
        label:       t.label,
        start_date:  t.startDate,
        end_date:    t.endDate,
        order_index: t.orderIndex,
      })),
    });

    return this.db.programCalendarTerm.findMany({
      where:   { calendar_id: calendarId },
      orderBy: { order_index: 'asc' },
    });
  }

  // ── Holiday Config ────────────────────────────────────────────────────────

  async upsertHolidayConfig(data: {
    orgId:          string;
    schoolYearId:   string;
    enabledKeys:    string[];
    customHolidays: object[];
  }) {
    return this.db.orgHolidayConfig.upsert({
      where: {
        org_id_school_year_id: {
          org_id:         data.orgId,
          school_year_id: data.schoolYearId,
        },
      },
      create: {
        org_id:          data.orgId,
        school_year_id:  data.schoolYearId,
        enabled_keys:    data.enabledKeys,
        custom_holidays: data.customHolidays,
      },
      update: {
        enabled_keys:    data.enabledKeys,
        custom_holidays: data.customHolidays,
      },
    });
  }

  async findHolidayConfig(orgId: string, schoolYearId: string) {
    return this.db.orgHolidayConfig.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId },
    });
  }
}