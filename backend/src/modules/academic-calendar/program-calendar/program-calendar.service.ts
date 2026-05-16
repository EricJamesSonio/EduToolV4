// backend/src/modules/academic-calendar/program-calendar.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProgramCalendarRepository } from './program-calendar.repository';
import { AcademicCalendarRepository } from '../academic-calendar.repository';
import {
  CreateProgramCalendarDto,
  UpdateProgramCalendarDto,
  QueryProgramCalendarDto,
  SaveHolidayConfigDto,
  SeedHolidaysToCalendarDto,
  BreakDto,
} from '../dto/program-calendar.dto';
import {
  PHILIPPINE_HOLIDAYS,
  getDefaultEnabledKeys,
  resolveHolidays,
  buildHolidayDates,
} from './data/holidays.data';

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

/**
 * Given a calendar start/end and sorted breaks, compute term date ranges.
 * Rules:
 *   term_end   = break_start - 1 day
 *   next_start = break_end   + 1 day
 *   last term  = last_break_end + 1 day → calendar end
 */
function computeTerms(
  calendarStart: Date,
  calendarEnd:   Date,
  sortedBreaks:  BreakInput[],
): ComputedTerm[] {
  const terms: ComputedTerm[] = [];

  let termStart = new Date(calendarStart);
  termStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedBreaks.length; i++) {
    const brk = sortedBreaks[i];

    // Term ends the day before the break
    const termEnd = new Date(brk.startDate);
    termEnd.setHours(0, 0, 0, 0);
    termEnd.setDate(termEnd.getDate() - 1);

    if (termEnd < termStart) {
      throw new BadRequestException(
        `Break "${brk.label}" starts before or on the same day as the previous term start. ` +
        `Ensure breaks don't overlap and have at least 1 day between them.`,
      );
    }

    terms.push({
      label:      `Term ${i + 1}`,
      orderIndex: i + 1,
      startDate:  new Date(termStart),
      endDate:    termEnd,
    });

    // Next term starts the day after the break ends
    termStart = new Date(brk.endDate);
    termStart.setHours(0, 0, 0, 0);
    termStart.setDate(termStart.getDate() + 1);
  }

  // Final term: from after last break (or calendar start if no breaks) → calendar end
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

/**
 * Validate break list:
 * - each break: start <= end
 * - breaks don't overlap each other
 * - all breaks within calendar range
 * Returns sorted breaks.
 */
function validateAndSortBreaks(
  breaks:        BreakInput[],
  calendarStart: Date,
  calendarEnd:   Date,
): BreakInput[] {
  // Validate individual breaks
  for (const b of breaks) {
    if (b.startDate > b.endDate) {
      throw new BadRequestException(
        `Break "${b.label}": start date must be before or equal to end date.`,
      );
    }
    if (b.startDate < calendarStart || b.endDate > calendarEnd) {
      throw new BadRequestException(
        `Break "${b.label}" falls outside the calendar date range ` +
        `(${calendarStart.toDateString()} – ${calendarEnd.toDateString()}).`,
      );
    }
  }

  // Sort chronologically
  const sorted = [...breaks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  // Check overlaps
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.startDate <= prev.endDate) {
      throw new BadRequestException(
        `Breaks "${prev.label}" and "${curr.label}" overlap. ` +
        `Each break must end before the next one starts.`,
      );
    }
  }

  return sorted;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgramCalendarService {
  constructor(
    private readonly repo:           ProgramCalendarRepository,
    private readonly calendarRepo:   AcademicCalendarRepository,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

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
    };
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateProgramCalendarDto) {
    const startDate = new Date(dto.startDate);
    const endDate   = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Calendar start date must be before end date.');
    }

    // Check uniqueness
    const existing = await this.repo.findByProgram(dto.programId, dto.schoolYearId, orgId);
    if (existing) {
      throw new ConflictException(
        'A calendar already exists for this program and school year. Update it instead.',
      );
    }

    // Create base calendar
    const calendar = await this.repo.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      programId:    dto.programId,
      startDate,
      endDate,
      notes:        dto.notes,
    });

    // Process breaks + compute terms if breaks provided
    if (dto.breaks && dto.breaks.length > 0) {
      await this._applyBreaks(calendar.id, orgId, dto.breaks, startDate, endDate);
    } else {
      // No breaks → single term spanning entire calendar
      await this.repo.replaceTerms(calendar.id, orgId, [
        { label: 'Term 1', orderIndex: 1, startDate, endDate },
      ]);
    }

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
      notes:     dto.notes     !== undefined ? (dto.notes ?? null) : undefined,
    });

    // Re-apply breaks if provided (full replacement)
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

  // ── Internal: apply breaks + recompute terms ───────────────────────────────

  private async _applyBreaks(
    calendarId: string,
    orgId:      string,
    rawBreaks:  BreakDto[],
    startDate:  Date,
    endDate:    Date,
  ) {
    const parsed = this.parseBreaks(rawBreaks);
    const sorted = validateAndSortBreaks(parsed, startDate, endDate);

    // Persist sorted breaks
    await this.repo.replaceBreaks(
      calendarId,
      orgId,
      sorted.map((b, i) => ({ ...b, orderIndex: i + 1 })),
    );

    // Compute and persist terms
    const computed = computeTerms(startDate, endDate, sorted);
    await this.repo.replaceTerms(calendarId, orgId, computed);
  }

  // ── Holiday Config ─────────────────────────────────────────────────────────

  /**
   * Returns the full holiday list with enabled/disabled status for the org+year.
   * If no config exists yet, defaults are used (isDefault=true holidays).
   */
  async getHolidayConfig(orgId: string, schoolYearId: string) {
    const config = await this.repo.findHolidayConfig(orgId, schoolYearId);
    const enabledKeys = config?.enabled_keys ?? getDefaultEnabledKeys();
    const customHolidays = (config?.custom_holidays as any[]) ?? [];

    return {
      schoolYearId,
      holidays:       resolveHolidays(enabledKeys),
      customHolidays,
    };
  }

  /**
   * Saves which system holidays are enabled + any custom holidays.
   */
  async saveHolidayConfig(orgId: string, dto: SaveHolidayConfigDto) {
    // Validate all enabled keys exist in the seed list
    const validKeys = new Set(PHILIPPINE_HOLIDAYS.map((h) => h.key));
    const invalid   = dto.enabledKeys.filter((k) => !validKeys.has(k));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown holiday keys: ${invalid.join(', ')}`,
      );
    }

    const config = await this.repo.upsertHolidayConfig({
      orgId,
      schoolYearId:   dto.schoolYearId,
      enabledKeys:    dto.enabledKeys,
      customHolidays: dto.customHolidays ?? [],
    });

    return {
      schoolYearId:   dto.schoolYearId,
      enabledKeys:    config.enabled_keys,
      customHolidays: config.custom_holidays,
    };
  }

  /**
   * Seeds enabled holidays into AcademicCalendar (existing event table)
   * as type='holiday' events for the given year.
   * Idempotent: skips any that already exist with the same title + date.
   */
  async seedHolidaysToCalendar(orgId: string, dto: SeedHolidaysToCalendarDto) {
    const config      = await this.repo.findHolidayConfig(orgId, dto.schoolYearId);
    const enabledKeys = config?.enabled_keys ?? getDefaultEnabledKeys();
    const holidayDates = buildHolidayDates(enabledKeys, dto.year);

    // Fetch existing calendar events to avoid duplicates
    const existing = await this.calendarRepo.findAll(orgId, dto.schoolYearId);
    const existingTitles = new Set(
      existing
        .filter((e) => e.type === 'holiday')
        .map((e) => `${e.title}__${new Date(e.start_date).toDateString()}`),
    );

    const toCreate = holidayDates.filter(
      (h) => !existingTitles.has(`${h.title}__${h.date.toDateString()}`),
    );

    for (const h of toCreate) {
      await this.calendarRepo.create({
        orgId,
        schoolYearId: dto.schoolYearId,
        title:        h.title,
        type:         'holiday',
        startDate:    h.date,
        endDate:      h.date,
        description:  h.description,
      });
    }

    // Also seed custom holidays
    const customHolidays = (config?.custom_holidays as any[]) ?? [];
    for (const ch of customHolidays) {
      const date = new Date(ch.date);
      const key  = `${ch.title}__${date.toDateString()}`;
      if (!existingTitles.has(key)) {
        await this.calendarRepo.create({
          orgId,
          schoolYearId: dto.schoolYearId,
          title:        ch.title,
          type:         'holiday',
          startDate:    date,
          endDate:      date,
          description:  ch.description ?? null,
        });
      }
    }

    return { seeded: toCreate.length };
  }

  /** Exposed for other modules (e.g. semester template smart calc) */
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