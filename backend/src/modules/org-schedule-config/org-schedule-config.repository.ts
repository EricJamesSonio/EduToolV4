import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class OrgScheduleConfigRepository {
  constructor(private readonly db: DatabaseService) {}

  findByOrg(orgId: string) {
    return this.db.orgScheduleConfig.findUnique({
      where: { org_id: orgId },
    });
  }

  upsert(
    orgId: string,
    data: {
      start_time: string;
      end_time: string;
      slot_duration: number;
      active_weekdays: number[];
      breaks: unknown;
    },
  ) {
    return this.db.orgScheduleConfig.upsert({
      where: { org_id: orgId },
      update: {
        start_time: data.start_time,
        end_time: data.end_time,
        slot_duration: data.slot_duration,
        active_weekdays: data.active_weekdays,
        breaks: (data.breaks ?? []) as never,
      },
      create: {
        org_id: orgId,
        start_time: data.start_time,
        end_time: data.end_time,
        slot_duration: data.slot_duration,
        active_weekdays: data.active_weekdays,
        breaks: (data.breaks ?? []) as never,
      },
    });
  }

  /**
   * Lazy-create with defaults if missing, mirroring OrgEnrollmentSetting pattern.
   * Defaults to all seven weekdays and no breaks, which is inert: it cannot
   * invalidate any existing schedule.
   */
  upsertDefaults(orgId: string) {
    return this.db.orgScheduleConfig.upsert({
      where: { org_id: orgId },
      update: {},
      create: {
        org_id: orgId,
        start_time: '07:00',
        end_time: '17:00',
        slot_duration: 30,
        active_weekdays: [0, 1, 2, 3, 4, 5, 6],
        breaks: [] as never,
      },
    });
  }
}
