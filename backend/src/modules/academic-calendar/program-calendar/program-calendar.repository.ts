// backend/src/modules/academic-calendar/program-calendar/program-calendar.repository.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class ProgramCalendarRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Program Calendar CRUD ─────────────────────────────────────────────────

  async create(data: {
    orgId:        string;
    schoolYearId: string;
    programId:    string;
    startDate:    Date;
    endDate:      Date;
    notes?:       string;
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
      include: {
        breaks:   { orderBy: { order_index: 'asc' } },
        terms:    { orderBy: { order_index: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
      },
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
        breaks:   { orderBy: { order_index: 'asc' } },
        terms:    { orderBy: { order_index: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.programCalendar.findFirst({
      where: { id, org_id: orgId },
      include: {
        breaks:   { orderBy: { order_index: 'asc' } },
        terms:    { orderBy: { order_index: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
      },
    });
  }

  async findByProgram(programId: string, schoolYearId: string, orgId: string) {
    return this.db.programCalendar.findFirst({
      where: { program_id: programId, school_year_id: schoolYearId, org_id: orgId },
      include: {
        breaks:   { orderBy: { order_index: 'asc' } },
        terms:    { orderBy: { order_index: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
      },
    });
  }

  /** Find all program calendars for an org — used during holiday re-sync */
  async findAllByOrg(orgId: string) {
    return this.db.programCalendar.findMany({
      where:  { org_id: orgId },
      select: { id: true },
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
        breaks:   { orderBy: { order_index: 'asc' } },
        terms:    { orderBy: { order_index: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
      },
    });
  }

  async delete(id: string) {
    // Cascade deletes breaks, terms, holidays via FK
    return this.db.programCalendar.delete({ where: { id } });
  }

  // ── Breaks ────────────────────────────────────────────────────────────────

  async replaceBreaks(
    calendarId: string,
    orgId:      string,
    breaks: Array<{ label: string; startDate: Date; endDate: Date; orderIndex: number }>,
  ) {
    await this.db.programCalendarBreak.deleteMany({ where: { calendar_id: calendarId } });
    if (!breaks.length) return;
    await this.db.programCalendarBreak.createMany({
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
    if (!terms.length) return;
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

  // ── Holidays (stored rows) ─────────────────────────────────────────────────

  /**
   * Replace all holiday rows for a calendar.
   * Called at creation time and on every OrgHolidayConfig save (re-sync).
   */
  async replaceHolidays(
    calendarId: string,
    orgId:      string,
    holidays: Array<{
      holidayKey:  string | null;
      title:       string;
      date:        Date;
      description: string | null;
      type:        'system' | 'custom';
    }>,
  ) {
    await this.db.programCalendarHoliday.deleteMany({ where: { calendar_id: calendarId } });
    if (!holidays.length) return;
    await this.db.programCalendarHoliday.createMany({
      data: holidays.map((h) => ({
        org_id:      orgId,
        calendar_id: calendarId,
        holiday_key: h.holidayKey,
        title:       h.title,
        date:        h.date,
        description: h.description,
        type:        h.type,
      })),
    });
  }

  // ── OrgHolidayConfig (org-global, no school_year_id) ──────────────────────

  async upsertHolidayConfig(data: {
    orgId:          string;
    enabledKeys:    string[];
    customHolidays: object[];
  }) {
    return this.db.orgHolidayConfig.upsert({
      where:  { org_id: data.orgId },
      create: {
        org_id:          data.orgId,
        enabled_keys:    data.enabledKeys,
        custom_holidays: data.customHolidays,
      },
      update: {
        enabled_keys:    data.enabledKeys,
        custom_holidays: data.customHolidays,
      },
    });
  }

  async findHolidayConfig(orgId: string) {
    return this.db.orgHolidayConfig.findUnique({
      where: { org_id: orgId },
    });
  }
}