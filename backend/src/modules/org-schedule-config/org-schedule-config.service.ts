import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OrgScheduleConfigRepository } from './org-schedule-config.repository';
import { UpsertOrgScheduleConfigDto } from './dto/org-schedule-config.dto';
import { DatabaseService } from '@/core/database/database.provider';
import {
  AppCacheService,
  APP_CACHE_TTL,
} from '@/core/cache/app-cache.service';
import {
  getScheduleViolation,
  toMinutes,
  type ScheduleBreak,
  type ScheduleWindow,
} from './schedule-window.util';
import { scheduleDateToMinutes } from '@/commons/utils/schedule-time.util';

/** Reads Prisma's `JsonValue` into typed breaks, dropping malformed entries. */
function parseBreaks(raw: unknown): ScheduleBreak[] {
  if (!Array.isArray(raw)) return [];
  const out: ScheduleBreak[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.label === 'string' &&
      typeof e.start === 'string' &&
      typeof e.end === 'string'
    ) {
      out.push({ label: e.label, start: e.start, end: e.end });
    }
  }
  return out;
}

@Injectable()
export class OrgScheduleConfigService {
  constructor(
    private readonly repo: OrgScheduleConfigRepository,
    private readonly db: DatabaseService,
    private readonly cache: AppCacheService,
  ) {}

  async getByOrg(orgId: string) {
    // Perf Phase 6: config changes rarely — 30-minute TTL, invalidated on upsert.
    return this.cache.cached(
      this.cache.key('org', orgId, 'schedule-config'),
      APP_CACHE_TTL.orgSettings,
      async () => {
        const cfg = await this.repo.upsertDefaults(orgId);
        return this.map(cfg);
      },
    );
  }

  /**
   * Validates break placement against the window and slot grid.
   *
   * Breaks must sit inside [startTime, endTime], must not overlap each other,
   * and must be slot-aligned (start offset and length are multiples of
   * slotDuration) so a class can never straddle a break boundary.
   */
  private validateBreaks(
    breaks: ScheduleBreak[],
    startM: number,
    endM: number,
    slotDuration: number,
  ): void {
    const sorted = [...breaks].sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start),
    );

    for (const b of sorted) {
      const bStart = toMinutes(b.start);
      const bEnd = toMinutes(b.end);

      if (bStart >= bEnd) {
        throw new BadRequestException(
          `Break "${b.label}" must start before it ends.`,
        );
      }
      if (bStart < startM || bEnd > endM) {
        throw new BadRequestException(
          `Break "${b.label}" (${b.start}–${b.end}) must be inside the school day ${this.timeFromMinutes(startM)}–${this.timeFromMinutes(endM)}.`,
        );
      }
      if ((bStart - startM) % slotDuration !== 0) {
        throw new BadRequestException(
          `Break "${b.label}" must start on a ${slotDuration}m slot boundary.`,
        );
      }
      if ((bEnd - bStart) % slotDuration !== 0) {
        throw new BadRequestException(
          `Break "${b.label}" must last a multiple of ${slotDuration}m.`,
        );
      }
    }

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (toMinutes(cur.start) < toMinutes(prev.end)) {
        throw new BadRequestException(
          `Breaks "${prev.label}" and "${cur.label}" overlap.`,
        );
      }
    }
  }

  private timeFromMinutes(min: number): string {
    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  async upsert(orgId: string, dto: UpsertOrgScheduleConfigDto) {
    const startM = toMinutes(dto.startTime);
    const endM = toMinutes(dto.endTime);

    if (startM >= endM) {
      throw new BadRequestException('startTime must be before endTime.');
    }

    const activeWeekdays = [...(dto.activeWeekdays ?? [])].sort((a, b) => a - b);
    const breaks = dto.breaks ?? [];
    this.validateBreaks(breaks, startM, endM, dto.slotDuration);

    const candidate: ScheduleWindow = {
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration: dto.slotDuration,
      activeWeekdays,
      breaks,
    };

    // Strict rule: reject if any existing LIVE class schedule would become
    // invalid under the new settings. "Live" excludes archived classes and
    // ended school years — both are read-only history and must never block a
    // settings change. Scoped to the org (tenant isolation) on every hop.
    const schedules = await this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: { deleted_at: null, schoolYear: { status: { not: 'ended' } } },
      },
      select: {
        start_time: true,
        end_time: true,
        weekday: true,
        class_id: true,
      },
    });

    const outOfBounds: string[] = [];
    const inactiveDay: string[] = [];
    const breakClash: string[] = [];
    const other: string[] = [];

    for (const s of schedules) {
      // UTC wall-clock -> minutes-of-day, per the schedule-time convention.
      // The previous local-getter round-trip via timeFromDate() shifted every
      // stored slot by the server's UTC offset when validating this change.
      const sStart = scheduleDateToMinutes(new Date(s.start_time));
      const sEnd = scheduleDateToMinutes(new Date(s.end_time));
      const violation = getScheduleViolation(
        candidate,
        sStart,
        sEnd,
        s.weekday,
      );
      if (!violation) continue;

      // Bucket by cause so the admin sees what to actually go and fix.
      if (sStart < startM || sEnd > endM) outOfBounds.push(s.class_id);
      else if (!activeWeekdays.includes(s.weekday)) inactiveDay.push(s.class_id);
      else if (
        breaks.some(
          (b) => sStart < toMinutes(b.end) && sEnd > toMinutes(b.start),
        )
      ) {
        breakClash.push(s.class_id);
      } else other.push(s.class_id);
    }

    const total =
      outOfBounds.length + inactiveDay.length + breakClash.length + other.length;
    if (total > 0) {
      const parts: string[] = [];
      if (outOfBounds.length)
        parts.push(`${outOfBounds.length} outside the new time range`);
      if (inactiveDay.length)
        parts.push(`${inactiveDay.length} on a day you just removed`);
      if (breakClash.length)
        parts.push(`${breakClash.length} overlapping a new break`);
      if (other.length)
        parts.push(`${other.length} misaligned to the new slot length`);
      throw new ConflictException(
        `Cannot update schedule settings: ${total} existing class schedule(s) would become invalid — ${parts.join(', ')}. Move or archive those classes first.`,
      );
    }

    const saved = await this.repo.upsert(orgId, {
      start_time: dto.startTime,
      end_time: dto.endTime,
      slot_duration: dto.slotDuration,
      active_weekdays: activeWeekdays,
      breaks,
    });
    await this.cache.del(this.cache.key('org', orgId, 'schedule-config'));
    return this.map(saved);
  }

  private map(row: {
    id: string;
    org_id: string;
    start_time: string;
    end_time: string;
    slot_duration: number;
    active_weekdays: number[];
    breaks: unknown;
    created_at: Date;
    updated_at: Date;
  }) {
    const activeWeekdays =
      Array.isArray(row.active_weekdays) && row.active_weekdays.length > 0
        ? [...row.active_weekdays].sort((a, b) => a - b)
        : [0, 1, 2, 3, 4, 5, 6];
    // A row with blank times (e.g. written before validation existed) must not
    // poison every schedule grid into fit-to-content fallback: fall back to the
    // same defaults a fresh org gets.
    return {
      id: row.id,
      orgId: row.org_id,
      startTime: row.start_time || '07:00',
      endTime: row.end_time || '17:00',
      slotDuration: row.slot_duration || 30,
      activeWeekdays,
      breaks: parseBreaks(row.breaks),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
