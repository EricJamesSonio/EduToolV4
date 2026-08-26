import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { OrgScheduleConfigService } from './org-schedule-config.service';
import { UpsertOrgScheduleConfigDto } from './dto/org-schedule-config.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('org-schedule-config')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class OrgScheduleConfigController {
  constructor(private readonly service: OrgScheduleConfigService) {}

  @Get()
  get(@CurrentUser() user: { org_id: string }) {
    return this.service.getByOrg(user.org_id);
  }

  @Put()
  upsert(
    @CurrentUser() user: { org_id: string },
    @Body() dto: UpsertOrgScheduleConfigDto,
  ) {
    return this.service.upsert(user.org_id, dto);
  }
}
