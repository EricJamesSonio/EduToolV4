// src/modules/academic-calendar/academic-calendar.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AcademicCalendarRepository } from './academic-calendar.repository';
import {
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  QueryCalendarEventDto,
} from './dto/academic-calendar.dto';

@Injectable()
export class AcademicCalendarService {
  constructor(
    private readonly calendarRepository: AcademicCalendarRepository,
  ) {}

  // ── POST /academic-calendar ─────────────────────────────────────────────────

  async create(orgId: string, dto: CreateCalendarEventDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start date must be before or equal to end date.',
      );
    }

    // Check if event is retroactive (start date is in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isRetroactive = startDate < today;

    const event = await this.calendarRepository.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      title: dto.title,
      type: dto.type,
      startDate,
      endDate,
      description: dto.description,
    });

    // Return with retroactive warning flag so the client can surface it
    return {
      ...event,
      warning: isRetroactive
        ? 'This event was added with a past date. Past attendance and session records may need manual review.'
        : null,
    };
  }

  // ── GET /academic-calendar?schoolYearId= ───────────────────────────────────

  async findAll(orgId: string, query: QueryCalendarEventDto) {
    return this.calendarRepository.findAll(orgId, query.schoolYearId);
  }

  // ── PATCH /academic-calendar/:id ───────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateCalendarEventDto) {
    const event = await this.calendarRepository.findById(id, orgId);

    if (!event) {
      throw new NotFoundException('Calendar event not found.');
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : event.start_date;
    const endDate = dto.endDate ? new Date(dto.endDate) : event.end_date;

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start date must be before or equal to end date.',
      );
    }

    // Warn again if the updated dates are retroactive
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isRetroactive = startDate < today;

    const updated = await this.calendarRepository.update(id, {
      title: dto.title,
      type: dto.type,
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
      description: dto.description,
    });

    return {
      ...updated,
      warning: isRetroactive
        ? 'This event has a past date. Past attendance and session records may need manual review.'
        : null,
    };
  }

  // ── DELETE /academic-calendar/:id ──────────────────────────────────────────

  async remove(id: string, orgId: string) {
    const event = await this.calendarRepository.findById(id, orgId);

    if (!event) {
      throw new NotFoundException('Calendar event not found.');
    }

    await this.calendarRepository.delete(id);
  }

  // ── Utility (used by class module in Phase 3) ───────────────────────────────

  /**
   * Returns only session-blocking events (holiday + no_class_day).
   * Called by class session generation to skip affected dates.
   */
  async getSessionBlockingEvents(orgId: string, schoolYearId: string) {
    return this.calendarRepository.findSessionBlockingEvents(
      orgId,
      schoolYearId,
    );
  }

  /**
   * Check if a specific date falls on a blocking calendar event.
   * Used by attendance and session generation in Phase 3.
   */
  async isBlockedDate(
    orgId: string,
    schoolYearId: string,
    date: Date,
  ): Promise<boolean> {
    const events = await this.calendarRepository.findSessionBlockingEvents(
      orgId,
      schoolYearId,
    );

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return events.some((event) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return checkDate >= start && checkDate <= end;
    });
  }
}
