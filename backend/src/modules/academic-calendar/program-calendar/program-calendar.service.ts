// backend/src/modules/academic-calendar/program-calendar/program-calendar.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgramCalendarService {
  constructor(
    private readonly repo: ProgramCalendarRepository,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

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

  private validateBreaks(
    rawBreaks:    BreakDto[],
    calendarStart: Date,
    calendarEnd:   Date,
  ) {
    const parsed = rawBreaks.map((b) => ({
      label:     b.label,
      startDate: new Date(b.startDate),
      endDate:   new Date(b.endDate),
    }));

    for (const b of parsed) {
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

    const sorted = [...parsed].sort(
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

  // ── Create (idempotent — redirects to update if exists) ────────────────────

  async create(orgId: string, dto: CreateProgramCalendarDto) {
    const startDate = new Date(dto.startDate);
    const endDate   = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Calendar start date must be before end date.');
    }

    const existing = await this.repo.findByProgram(dto.programId, dto.schoolYearId, orgId);
    if (existing) {
      // Idempotent: silently update instead of throwing ConflictException
      return this.update(existing.id, orgId, {
        startDate: dto.startDate,
        endDate:   dto.endDate,
        notes:     dto.notes,
        breaks:    dto.breaks ?? [],
      });
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

    // Save breaks (skeleton only — no term computing)
    if (dto.breaks && dto.breaks.length > 0) {
      const sorted = this.validateBreaks(dto.breaks, startDate, endDate);
      await this.repo.replaceBreaks(
        calendar.id, orgId,
        sorted.map((b, i) => ({ ...b, orderIndex: i + 1 })),
      );
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

  /** Returns calendar info + breaks for semester-template assignment, or null if none */
  async getCalendarForProgram(programId: string, schoolYearId: string, orgId: string) {
    const cal = await this.repo.findByProgram(programId, schoolYearId, orgId);
    if (!cal) return null;
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
      const sorted = this.validateBreaks(dto.breaks, startDate, endDate);
      await this.repo.replaceBreaks(
        id, orgId,
        sorted.map((b, i) => ({ ...b, orderIndex: i + 1 })),
      );
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

  async getHolidayConfig(orgId: string) {
    const config         = await this.repo.findHolidayConfig(orgId);
    const enabledKeys    = config?.enabled_keys    ?? getDefaultEnabledKeys();
    const customHolidays = (config?.custom_holidays as any[]) ?? [];

    return {
      holidays:       resolveHolidays(enabledKeys),
      customHolidays,
    };
  }

  async saveHolidayConfig(orgId: string, dto: SaveHolidayConfigDto) {
    const validKeys = new Set(PHILIPPINE_HOLIDAYS.map((h) => h.key));
    const invalid   = dto.enabledKeys.filter((k) => !validKeys.has(k));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unknown holiday keys: ${invalid.join(', ')}`);
    }

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

  // ── Seed default holidays (smart — skips already-enabled) ──────────────────

  async seedDefaultHolidays(orgId: string) {
    const existing = await this.repo.findHolidayConfig(orgId);
    const currentEnabled = new Set(existing?.enabled_keys ?? []);

    const defaultKeys = getDefaultEnabledKeys();
    const merged = [...new Set([...currentEnabled, ...defaultKeys])];

    const added = merged.filter((k) => !currentEnabled.has(k));
    const skipped = merged.length - added.length;

    const config = await this.repo.upsertHolidayConfig({
      orgId,
      enabledKeys:    merged,
      customHolidays: (existing?.custom_holidays as any[]) ?? [],
    });

    // Re-sync existing program calendars
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
      added,
      skipped,
      synced: allCalendars.length,
    };
  }

  // ── Terms (for semester template module — reads from breaks) ───────────────

  async getTermsForProgram(programId: string, schoolYearId: string, orgId: string) {
    const cal = await this.repo.findByProgram(programId, schoolYearId, orgId);
    if (!cal) return [];

    // No term computing — return empty; semester template module handles this
    return [];
  }
}