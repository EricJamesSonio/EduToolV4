import { Injectable } from '@nestjs/common';
import { ProgramCalendarService } from '@/modules/academic-calendar/program-calendar/program-calendar.service';
import { PROGRAMS } from '../data/programs.data';
import { SeedContext } from '../seed-context';

/**
 * Seeds one ProgramCalendar (with period/break rows) per selected department.
 * Calendars are strictly per Program + SchoolYear — never shared across
 * programs, even of the same program_type (DB enforces
 * @@unique([program_id, school_year_id])).
 *
 * Runs AFTER program creation (needs ctx.programMap) and BEFORE the semester
 * template seeder, which requires an existing calendar before it will
 * auto-register a template.
 */
@Injectable()
export class ProgramCalendarSeederService {
  constructor(private readonly calendarService: ProgramCalendarService) {}

  async seed(ctx: SeedContext): Promise<void> {
    if (!ctx.seedProgramCalendars) return;

    for (const p of PROGRAMS) {
      if (!ctx.shouldSeedProgram(p.key)) {
        ctx.result.programCalendars.skipped++;
        continue;
      }

      const programId = ctx.programMap[p.key];
      if (!programId) {
        ctx.result.programCalendars.skipped++;
        continue;
      }

      const config = ctx.programCalendars[p.key];
      if (!config?.startDate || !config?.endDate) {
        ctx.result.programCalendars.skipped++;
        continue;
      }

      const existing = await this.calendarService.getCalendarForProgram(
        programId,
        ctx.schoolYearId,
        ctx.orgId,
      );

      await this.calendarService.create(ctx.orgId, {
        schoolYearId: ctx.schoolYearId,
        programId,
        startDate: config.startDate,
        endDate: config.endDate,
        notes: config.notes,
        breaks: (config.breaks ?? []).filter((b) => b.startDate && b.endDate),
      });

      if (existing) {
        ctx.result.programCalendars.already_exists++;
      } else {
        ctx.result.programCalendars.seeded++;
      }
    }
  }
}
