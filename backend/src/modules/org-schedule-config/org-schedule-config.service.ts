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
import { getScheduleViolation, toMinutes } from './schedule-window.util';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function timeFromDate(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
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

  async upsert(orgId: string, dto: UpsertOrgScheduleConfigDto) {
    const startM = toMinutes(dto.startTime);
    const endM = toMinutes(dto.endTime);

    if (startM >= endM) {
      throw new BadRequestException('startTime must be before endTime.');
    }

    // Blocking rule: reject if any existing ClassSchedule would be out-of-bounds or misaligned
    const schedules = await this.db.classSchedule.findMany({
      where: { org_id: orgId },
      select: { start_time: true, end_time: true, class_id: true },
    });

    let affected = 0;
    for (const s of schedules) {
      const sStart = toMinutes(timeFromDate(new Date(s.start_time)));
      const sEnd = toMinutes(timeFromDate(new Date(s.end_time)));
      const dur = sEnd - sStart;

      const outOfBounds = sStart < startM || sEnd > endM;
      const wrongDuration = dur % dto.slotDuration !== 0;
      const misaligned = (sStart - startM) % dto.slotDuration !== 0;

      if (outOfBounds || wrongDuration || misaligned) {
        affected += 1;
      }
    }

    if (affected > 0) {
      throw new ConflictException(
        `Cannot update schedule settings: ${affected} existing class schedule(s) would be out of bounds or misaligned with the new settings. Adjust or remove those classes first.`,
      );
    }

    const saved = await this.repo.upsert(orgId, {
      start_time: dto.startTime,
      end_time: dto.endTime,
      slot_duration: dto.slotDuration,
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
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      id: row.id,
      orgId: row.org_id,
      startTime: row.start_time,
      endTime: row.end_time,
      slotDuration: row.slot_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
