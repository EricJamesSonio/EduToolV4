import { Injectable } from '@nestjs/common';
import { OrgEnrollmentSettingRepository } from './org-enrollment-setting.repository';
import { UpsertOrgEnrollmentSettingDto } from './dto/org-enrollment-setting.dto';
import {
  AppCacheService,
  APP_CACHE_TTL,
} from '@/core/cache/app-cache.service';

@Injectable()
export class OrgEnrollmentSettingService {
  constructor(
    private readonly repo: OrgEnrollmentSettingRepository,
    private readonly cache: AppCacheService,
  ) {}

  async getByOrg(orgId: string) {
    console.log('orgId:', orgId);
    // Perf Phase 6: settings change rarely — 30-minute TTL, invalidated on
    // upsert. (Note: the repo call is itself an upsert-defaults write; the
    // cache also spares that write on hits. Same observable result.)
    return this.cache.cached(
      this.cache.key('org', orgId, 'enrollment-setting'),
      APP_CACHE_TTL.orgSettings,
      () => this.repo.upsert(orgId, {}),
    );
  }

  async upsert(orgId: string, dto: UpsertOrgEnrollmentSettingDto) {
    const saved = await this.repo.upsert(orgId, dto);
    await this.cache.del(this.cache.key('org', orgId, 'enrollment-setting'));
    return saved;
  }
}
