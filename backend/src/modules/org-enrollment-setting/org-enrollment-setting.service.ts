import { Injectable } from '@nestjs/common'
import { OrgEnrollmentSettingRepository } from './org-enrollment-setting.repository'
import { UpsertOrgEnrollmentSettingDto }  from './dto/org-enrollment-setting.dto'

@Injectable()
export class OrgEnrollmentSettingService {
  constructor(private readonly repo: OrgEnrollmentSettingRepository) {}

  async getByOrg(orgId: string) {
    // Return defaults if not yet configured
    const setting = await this.repo.findByOrg(orgId)
    if (!setting) {
      return {
        org_id:                        orgId,
        require_semester_reenrollment: false,
        auto_unenroll_on_year_end:     true,
      }
    }
    return setting
  }

  upsert(orgId: string, dto: UpsertOrgEnrollmentSettingDto) {
    return this.repo.upsert(orgId, dto)
  }
}