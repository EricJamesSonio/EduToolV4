import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class OrgEnrollmentSettingRepository {
  constructor(private readonly db: DatabaseService) {}

  findByOrg(orgId: string) {
    return this.db.orgEnrollmentSetting.findUnique({
      where: { org_id: orgId },
    })
  }

  upsert(
    orgId: string,
    data: {
      require_semester_reenrollment?: boolean
      auto_unenroll_on_year_end?:     boolean
    },
  ) {
    return this.db.orgEnrollmentSetting.upsert({
      where:  { org_id: orgId },
      update: data,
      create: {
        org_id:                        orgId,
        require_semester_reenrollment: data.require_semester_reenrollment ?? false,
        auto_unenroll_on_year_end:     data.auto_unenroll_on_year_end     ?? true,
      },
    })
  }
}