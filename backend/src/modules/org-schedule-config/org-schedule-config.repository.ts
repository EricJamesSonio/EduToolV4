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
    data: { start_time: string; end_time: string; slot_duration: number },
  ) {
    return this.db.orgScheduleConfig.upsert({
      where: { org_id: orgId },
      update: {
        start_time: data.start_time,
        end_time: data.end_time,
        slot_duration: data.slot_duration,
      },
      create: {
        org_id: orgId,
        start_time: data.start_time,
        end_time: data.end_time,
        slot_duration: data.slot_duration,
      },
    });
  }

  /** Lazy-create with defaults if missing, mirroring OrgEnrollmentSetting pattern */
  upsertDefaults(orgId: string) {
    return this.db.orgScheduleConfig.upsert({
      where: { org_id: orgId },
      update: {},
      create: {
        org_id: orgId,
        start_time: '07:00',
        end_time: '17:00',
        slot_duration: 30,
      },
    });
  }
}
