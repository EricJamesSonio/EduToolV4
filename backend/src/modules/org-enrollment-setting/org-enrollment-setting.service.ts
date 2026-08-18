import { Injectable } from '@nestjs/common';
import { OrgEnrollmentSettingRepository } from './org-enrollment-setting.repository';
import { UpsertOrgEnrollmentSettingDto } from './dto/org-enrollment-setting.dto';

@Injectable()
export class OrgEnrollmentSettingService {
  constructor(private readonly repo: OrgEnrollmentSettingRepository) {}

  async getByOrg(orgId: string) {
    console.log('orgId:', orgId);
    return this.repo.upsert(orgId, {});
  }

  upsert(orgId: string, dto: UpsertOrgEnrollmentSettingDto) {
    return this.repo.upsert(orgId, dto);
  }
}
