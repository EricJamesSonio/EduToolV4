// backend/src/modules/academic-calendar/program-calendar/program-calendar.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProgramCalendarRepository } from './program-calendar.repository';
import {
  CreateProgramCalendarDto,
  UpdateProgramCalendarDto,
  QueryProgramCalendarDto,
  SaveHolidayConfigDto,
  BreakDto,
} from '../dto/program-calendar.dto';
import {
  PHILIPPINE_HOLIDAYS,
  getDefaultEnabledKeys,
  resolveHolidays,
  buildHolidayDates,
} from '../data/holidays.data';

// ── Internal helpers ──────────────────────────────────────────────────────────

interface BreakInput {
  label:     string;
  startDate: Date;
  endDate:   Date;
}

interface ComputedTerm {
  label:      string;
  orderIndex: number;
  startDate:  Date;
  endDate:    Date;
}

function computeTerms(
  calendarStart: Date,
  calendarEnd:   Date,
  sortedBreaks:  BreakInput[],
): ComputedTerm[] {
  const terms: ComputedTerm[] = [];
  let termStart = new Date(calendarStart);
  termStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedBreaks.length; i++) {
    const brk     = sortedBreaks[i];
    const termEnd = new Date(brk.startDate);
    termEnd.setHours(0, 0, 0, 0);
    termEnd.setDate(termEnd.getDate() - 1);

    if (termEnd < termStart) {
      throw new BadRequestException(
        `Break "${brk.label}" starts before or on the same day as the previous term start.`,
      );
    }

    terms.push({
      label:      `Term ${i + 1}`,
      orderIndex: i + 1,
      startDate:  new Date(termStart),
      endDate:    termEnd,
    });

    termStart = new Date(brk.endDate);
    termStart.setHours(0, 0, 0, 0);
    termStart.setDate(termStart.getDate() + 1);
  }

  const finalEnd = new Date(calendarEnd);
  finalEnd.setHours(0, 0, 0, 0);
  if (termStart <= finalEnd) {
    terms.push({
      label:      `Term ${sortedBreaks.length + 1}`,
      orderIndex: sortedBreaks.length + 1,
      startDate:  new Date(termStart),
      endDate:    finalEnd,
    });
  }

  return terms;
}

function validateAndSortBreaks(
  breaks:        BreakInput[],
  calendarStart: Date,
  calendarEnd:   Date,
): BreakInput[] {
  for (const b of breaks) {
    if (b.startDate > b.endDate) {
      throw new BadRequestException(
        `Break "${b.label}": start date must be before or equal to end date.`,
      );
    }
    if (b.startDate < calendarStart || b.endDate > calendarEnd) {
      throw new BadRequestException(
        `Break "${b.label}" falls outside the calendar range ` +
        `(${calendarStart.toDateString()} – ${calendarEnd.toDateString()}).`,
      );
    }
  }

  const sorted = [...breaks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startDate <= sorted[i - 1].endDate) {
      throw new BadRequestException(
        `Breaks "${sorted[i - 1].label}" and "${sorted[i].label}" overlap.`,
      );
    }
  }

  return sorted;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgramCalendarService {
  constructor(
    private readonly repo: ProgramCalendarRepository,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private parseBreaks(rawBreaks: BreakDto[]): BreakInput[] {
    return rawBreaks.map((b) => ({
      label:     b.label,
      startDate: new Date(b.startDate),
      endDate:   new Date(b.endDate),
    }));
  }

  private mapCalendar(cal: any) {
    return {
      id:           cal.id,
      orgId:        cal.org_id,
      schoolYearId: cal.school_year_id,
      programId:    cal.program_id,
      startDate:    cal.start_date,
      endDate:      cal.end_date,
      notes:        cal.notes ?? null,
      createdAt:    cal.created_at,
      updatedAt:    cal.updated_at,
      breaks: (cal.breaks ?? []).map((b: any) => ({
        id:         b.id,
        label:      b.label,
        startDate:  b.start_date,
        endDate:    b.end_date,
        orderIndex: b.order_index,
      })),
      terms: (cal.terms ?? []).map((t: any) => ({
        id:         t.id,
        label:      t.label,
        startDate:  t.start_date,
        endDate:    t.end_date,
        orderIndex: t.order_index,
      })),
      holidays: (cal.holidays ?? []).map((h: any) => ({
        id:          h.id,
        holidayKey:  h.holiday_key ?? null,
        title:       h.title,
        date:        h.date,
        description: h.description ?? null,
        type:        h.type,
      })),
    };
  }

  /**
   * Build the holiday rows to store from OrgHolidayConfig.
   * Uses the calendar's start_date year to compute actual dates.
   */
  private buildHolidayRows(
    enabledKeys:    string[],
    customHolidays: any[],
    calendarYear:   number,
  ) {
    const systemHolidays = buildHolidayDates(enabledKeys, calendarYear).map((h) => ({
      holidayKey:  h.key,
      title:       h.title,
      date:        h.date,
      description: h.description ?? null,
      type:        'system' as const,
    }));

    const custom = customHolidays.map((ch: any) => ({
      holidayKey:  null,
      title:       ch.title,
      date:        new Date(ch.date),
      description: ch.description ?? null,
      type:        'custom' as const,
    }));

    return [...systemHolidays, ...custom];
  }

  private async _applyBreaks(
    calendarId: string,
    orgId:      string,
    rawBreaks:  BreakDto[],
    startDate:  Date,
    endDate:    Date,
  ) {
    const parsed = this.parseBreaks(rawBreaks);
    const sorted = validateAndSortBreaks(parsed, startDate, endDate);
    await this.repo.replaceBreaks(
      calendarId, orgId,
      sorted.map((b, i) => ({ ...b, orderIndex: i + 1 })),
    );
    const computed = computeTerms(startDate, endDate, sorted);
    await this.repo.replaceTerms(calendarId, orgId, computed);
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateProgramCalendarDto) {
    const startDate = new Date(dto.startDate);
    const endDate   = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Calendar start date must be before end date.');
    }

    const existing = await this.repo.findByProgram(dto.programId, dto.schoolYearId, orgId);
    if (existing) {
      throw new ConflictException(
        'A calendar already exists for this program and school year. Update it instead.',
      );
    }

    // Create the calendar record
    const calendar = await this.repo.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      programId:    dto.programId,
      startDate,
      endDate,
      notes:        dto.notes,
    });

    // Apply breaks + compute terms
    if (dto.breaks && dto.breaks.length > 0) {
      await this._applyBreaks(calendar.id, orgId, dto.breaks, startDate, endDate);
    } else {
      await this.repo.replaceTerms(calendar.id, orgId, [
        { label: 'Term 1', orderIndex: 1, startDate, endDate },
      ]);
    }

    // Inherit holidays from org-global config
    const config        = await this.repo.findHolidayConfig(orgId);
    const enabledKeys   = config?.enabled_keys    ?? getDefaultEnabledKeys();
    const customHols    = (config?.custom_holidays as any[]) ?? [];
    const holidayRows   = this.buildHolidayRows(enabledKeys, customHols, startDate.getFullYear());
    await this.repo.replaceHolidays(calendar.id, orgId, holidayRows);

    const fresh = await this.repo.findById(calendar.id, orgId);
    return this.mapCalendar(fresh);
  }

  // ── Find All ───────────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryProgramCalendarDto) {
    const calendars = await this.repo.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      programId:    query.programId,
    });
    return calendars.map((c) => this.mapCalendar(c));
  }

  // ── Find One ───────────────────────────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const cal = await this.repo.findById(id, orgId);
    if (!cal) throw new NotFoundException('Program calendar not found.');
    return this.mapCalendar(cal);
  }

  async findByProgram(programId: string, schoolYearId: string, orgId: string) {
    const cal = await this.repo.findByProgram(programId, schoolYearId, orgId);
    if (!cal) throw new NotFoundException('No calendar found for this program and school year.');
    return this.mapCalendar(cal);
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateProgramCalendarDto) {
    const existing = await this.repo.findById(id, orgId);
    if (!existing) throw new NotFoundException('Program calendar not found.');

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.start_date;
    const endDate   = dto.endDate   ? new Date(dto.endDate)   : existing.end_date;

    if (startDate >= endDate) {
      throw new BadRequestException('Calendar start date must be before end date.');
    }

    await this.repo.update(id, {
      startDate: dto.startDate ? startDate : undefined,
      endDate:   dto.endDate   ? endDate   : undefined,
      notes:     dto.notes !== undefined ? (dto.notes ?? null) : undefined,
    });

    if (dto.breaks !== undefined) {
      await this._applyBreaks(id, orgId, dto.breaks, startDate, endDate);
    }

    const fresh = await this.repo.findById(id, orgId);
    return this.mapCalendar(fresh);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async delete(id: string, orgId: string) {
    const existing = await this.repo.findById(id, orgId);
    if (!existing) throw new NotFoundException('Program calendar not found.');
    await this.repo.delete(id);
  }

  // ── Holiday Config (org-global) ────────────────────────────────────────────

  /**
   * Get the org's global holiday config.
   * schoolYearId is accepted for the query param but config is org-scoped.
   * We return it with the full resolved holiday list (enabled/disabled).
   */
  async getHolidayConfig(orgId: string) {
    const config         = await this.repo.findHolidayConfig(orgId);
    const enabledKeys    = config?.enabled_keys    ?? getDefaultEnabledKeys();
    const customHolidays = (config?.custom_holidays as any[]) ?? [];

    return {
      holidays:       resolveHolidays(enabledKeys),
      customHolidays,
    };
  }

  /**
   * Save the org's global holiday config.
   * After saving, ALL existing ProgramCalendars for this org are re-synced:
   * their ProgramCalendarHoliday rows are deleted and rebuilt from the new config.
   */
  async saveHolidayConfig(orgId: string, dto: SaveHolidayConfigDto) {
    // Validate keys
    const validKeys = new Set(PHILIPPINE_HOLIDAYS.map((h) => h.key));
    const invalid   = dto.enabledKeys.filter((k) => !validKeys.has(k));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unknown holiday keys: ${invalid.join(', ')}`);
    }

    // Persist config
    const config = await this.repo.upsertHolidayConfig({
      orgId,
      enabledKeys:    dto.enabledKeys,
      customHolidays: dto.customHolidays ?? [],
    });

    // Re-sync ALL existing program calendars for this org
    const allCalendars = await this.repo.findAllByOrg(orgId);
    const allFull      = await Promise.all(
      allCalendars.map((c) => this.repo.findById(c.id, orgId)),
    );

    for (const cal of allFull) {
      if (!cal) continue;
      const year        = new Date(cal.start_date).getFullYear();
      const holidayRows = this.buildHolidayRows(
        config.enabled_keys,
        config.custom_holidays as any[],
        year,
      );
      await this.repo.replaceHolidays(cal.id, orgId, holidayRows);
    }

    return {
      holidays:       resolveHolidays(config.enabled_keys),
      customHolidays: config.custom_holidays,
      synced:         allCalendars.length,
    };
  }

  // ── Terms (consumed by semester template module) ───────────────────────────

  async getTermsForProgram(programId: string, schoolYearId: string, orgId: string) {
    const cal = await this.repo.findByProgram(programId, schoolYearId, orgId);
    if (!cal) return [];
    return (cal.terms ?? []).map((t: any) => ({
      id:         t.id,
      label:      t.label,
      startDate:  t.start_date,
      endDate:    t.end_date,
      orderIndex: t.order_index,
    }));
  }
}