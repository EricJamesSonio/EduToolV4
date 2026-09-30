import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

/** Raw stored row, exactly as Prisma returns it. */
export interface ScheduleProfileRow {
  use_custom_availability: boolean;
  available_weekdays: number[];
  max_minutes_per_day: number | null;
  max_minutes_per_week: number | null;
}

/** The shape the API returns: raw values plus the resolved weekdays. */
export interface EffectiveScheduleProfile {
  useCustomAvailability: boolean;
  availableWeekdays: number[];
  maxMinutesPerDay: number | null;
  maxMinutesPerWeek: number | null;
  effectiveWeekdays: number[];
}

/**
 * Intersects a profile's declared weekdays with the org's active days.
 *
 * Exported because the generator and the readiness report need the SAME
 * intersection semantics — a second implementation would eventually disagree.
 * An empty `availableWeekdays` means "not configured", which is not the same as
 * "configured to nothing", hence the separate boolean.
 */
export function intersectWeekdays(
  available: number[] | undefined,
  orgActive: number[] | undefined,
): number[] {
  const org = orgActive ?? [];
  if (!available || available.length === 0) return [...org];
  if (org.length === 0) return [...available];
  return available.filter((d) => org.includes(d)).sort((a, b) => a - b);
}

@Injectable()
export class EducatorScheduleProfileRepository {
  constructor(private readonly db: DatabaseService) {}

  findOne(orgId: string, educatorId: string) {
    return this.db.educatorScheduleProfile.findUnique({
      where: { educator_id: educatorId },
      select: {
        use_custom_availability: true,
        available_weekdays: true,
        max_minutes_per_day: true,
        max_minutes_per_week: true,
      },
    });
  }

  async upsert(
    orgId: string,
    educatorId: string,
    data: {
      useCustomAvailability: boolean;
      availableWeekdays: number[];
      maxMinutesPerDay: number | null;
      maxMinutesPerWeek: number | null;
    },
  ): Promise<ScheduleProfileRow> {
    return this.db.educatorScheduleProfile.upsert({
      where: { educator_id: educatorId },
      create: {
        org_id: orgId,
        educator_id: educatorId,
        use_custom_availability: data.useCustomAvailability,
        available_weekdays: data.availableWeekdays,
        max_minutes_per_day: data.maxMinutesPerDay,
        max_minutes_per_week: data.maxMinutesPerWeek,
      },
      update: {
        use_custom_availability: data.useCustomAvailability,
        available_weekdays: data.availableWeekdays,
        max_minutes_per_day: data.maxMinutesPerDay,
        max_minutes_per_week: data.maxMinutesPerWeek,
      },
      select: {
        use_custom_availability: true,
        available_weekdays: true,
        max_minutes_per_day: true,
        max_minutes_per_week: true,
      },
    });
  }

  /**
   * Bulk loader for the generator: profiles for many educators in ONE query.
   * The alternative — one query per educator — is an N+1 across a faculty.
   *
   * Educators with no row are simply absent from the map; the caller applies
   * the "default = every school day" rule for them.
   */
  async getProfilesByEducator(
    orgId: string,
    educatorIds: string[],
  ): Promise<Map<string, ScheduleProfileRow>> {
    const out = new Map<string, ScheduleProfileRow>();
    if (educatorIds.length === 0) return out;

    const rows = await this.db.educatorScheduleProfile.findMany({
      where: { org_id: orgId, educator_id: { in: educatorIds } },
      select: {
        educator_id: true,
        use_custom_availability: true,
        available_weekdays: true,
        max_minutes_per_day: true,
        max_minutes_per_week: true,
      },
    });

    for (const r of rows) {
      out.set(r.educator_id, {
        use_custom_availability: r.use_custom_availability,
        available_weekdays: r.available_weekdays,
        max_minutes_per_day: r.max_minutes_per_day,
        max_minutes_per_week: r.max_minutes_per_week,
      });
    }
    return out;
  }

  /**
   * How many of this educator's live classes already sit on a day outside the
   * new availability. A WARNING only — existing classes are never moved
   * automatically.
   */
  async countClassesOutsideWeekdays(
    orgId: string,
    educatorId: string,
    allowedWeekdays: number[],
  ): Promise<number> {
    if (allowedWeekdays.length === 0) return 0;

    const rows = await this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        class: {
          educator_id: educatorId,
          deleted_at: null,
          schoolYear: { status: { not: 'ended' } },
        },
      },
      select: { weekday: true },
      distinct: ['class_id'],
    });

    return rows.filter((r) => !allowedWeekdays.includes(r.weekday)).length;
  }

  async assertEducator(orgId: string, educatorId: string): Promise<void> {
    const acc = await this.db.account.findFirst({
      where: { id: educatorId, org_id: orgId, role: 'educator', deleted_at: null },
      select: { id: true },
    });
    if (!acc) throw new NotFoundException('Educator not found.');
  }
}
