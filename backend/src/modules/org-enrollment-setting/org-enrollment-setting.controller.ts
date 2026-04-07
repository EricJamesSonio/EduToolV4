import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common'
import { OrgEnrollmentSettingService }   from './org-enrollment-setting.service'
import { UpsertOrgEnrollmentSettingDto } from './dto/org-enrollment-setting.dto'
import { AuthGuard }   from '@/commons/guards/auth.guard'
import { RolesGuard }   from '@/commons/guards/role.guard'
import { Roles }       from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

@Controller('org-enrollment-settings')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class OrgEnrollmentSettingController {
  constructor(private readonly service: OrgEnrollmentSettingService) {}

  @Get()
  get(@CurrentUser() user: { org_id: string }) {
    return this.service.getByOrg(user.org_id)
  }

  @Put()
  upsert(
    @CurrentUser() user: { org_id: string },
    @Body() dto: UpsertOrgEnrollmentSettingDto,
  ) {
    return this.service.upsert(user.org_id, dto)
  }
}