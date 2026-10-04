import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  EducatorScheduleProfileRepository,
  intersectWeekdays,
  type ScheduleProfileRow,
  type EffectiveScheduleProfile,
} from './educator-schedule-profile.repository';
// A VALUE import, not `import type`: emitDecoratorMetadata needs the runtime
// token so Nest can inject this. See schedule-window.provider.ts.
import { OrgScheduleConfigProvider } from '../org-schedule-config/schedule-window.provider';

/**
 * Fewer effective weekdays = scarcer. The generator assigns the scarcest
 * eligible educator first, so a Tue/Thu-only educator is not consumed by a
 * subject that anyone could have taken.
 */
export function getScarcityRank(weekdays: number[]): number {
  return weekdays.length;
}

@Injectable()
export class EducatorScheduleProfileService {
  constructor(
    private readonly repo: EducatorScheduleProfileRepository,
    private readonly db: DatabaseService,
    private readonly orgScheduleConfig: OrgScheduleConfigProvider,
  ) {}

  private async orgActiveWeekdays(orgId: string): Promise<number[]> {
    const cfg = await this.orgScheduleConfig.getByOrg(orgId);
    return cfg.activeWeekdays ?? [0, 1, 2, 3, 4, 5, 6];
  }

  /** Resolves one stored row into the days actually usable, given the org week. */
  private resolve(
    row: ScheduleProfileRow | null,
    orgActive: number[],
  ): EffectiveScheduleProfile {
    // No row at all, or a row that never opted in, both mean "available on
    // every school day" — that is what makes a new educator need no setup.
    const useCustom = row?.use_custom_availability ?? false;
    const effectiveWeekdays = useCustom
      ? intersectWeekdays(row?.available_weekdays, orgActive)
      : [...orgActive];
    return {
      useCustomAvailability: useCustom,
      availableWeekdays: row?.available_weekdays ?? [],
      maxMinutesPerDay: row?.max_minutes_per_day ?? null,
      maxMinutesPerWeek: row?.max_minutes_per_week ?? null,
      effectiveWeekdays: [...effectiveWeekdays].sort((a, b) => a - b),
    };
  }

  /** GET /educators/:id/schedule-profile */
  async get(orgId: string, educatorId: string) {
    await this.repo.assertEducator(orgId, educatorId);
    const orgActive = await this.orgActiveWeekdays(orgId);
    const row = await this.repo.findOne(orgId, educatorId);
    return { educatorId, ...this.resolve(row, orgActive) };
  }

  /** PUT /educators/:id/schedule-profile */
  async set(
    orgId: string,
    educatorId: string,
    dto: {
      useCustomAvailability: boolean;
      availableWeekdays: number[];
    },
  ) {
    await this.repo.assertEducator(orgId, educatorId);

    const weekdays = [...new Set(dto.availableWeekdays)].sort((a, b) => a - b);
    for (const d of weekdays) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        throw new BadRequestException('Weekdays must be 0-6 (0 = Sunday).');
      }
    }

    // An educator who is available on nothing can never be scheduled. That is
    // a status problem (suspended/transferred), not an availability one.
    if (dto.useCustomAvailability && weekdays.length === 0) {
      throw new BadRequestException(
        'Select at least one available day, or switch back to "available on all school days".',
      );
    }

    // Load limits were removed: an available day means the educator is
    // available for the whole org schedule window that day. Stored limits from
    // before the removal are cleared here; the columns stay for history.
    const saved = await this.repo.upsert(orgId, educatorId, {
      useCustomAvailability: dto.useCustomAvailability,
      availableWeekdays: dto.useCustomAvailability ? weekdays : [],
      maxMinutesPerDay: null,
      maxMinutesPerWeek: null,
    });

    const orgActive = await this.orgActiveWeekdays(orgId);
    const resolved = this.resolve(saved, orgActive);

    // A warning, never a block: existing classes are never auto-moved.
    const outsideAvailabilityClassCount = await this.repo.countClassesOutsideWeekdays(
      orgId,
      educatorId,
      resolved.effectiveWeekdays,
    );

    return {
      educatorId,
      ...resolved,
      outsideAvailabilityClassCount,
    };
  }
}
