import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { OrgScheduleConfigService } from './org-schedule-config.service';
import { UpsertOrgScheduleConfigDto } from './dto/org-schedule-config.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('org-schedule-config')
@UseGuards(AuthGuard, RolesGuard)
export class OrgScheduleConfigController {
  constructor(private readonly service: OrgScheduleConfigService) {}

  // Roles are declared per handler, not on the class: READ is open to
  // educators and students because the school operating window
  // (startTime/endTime/slotDuration) is low-sensitivity reference data that
  // the educator and student weekly schedule grids need in order to render a
  // full day. WRITE stays admin-only.
  @Get()
  @Roles('admin', 'educator', 'student')
  get(@CurrentUser() user: { org_id: string }) {
    return this.service.getByOrg(user.org_id);
  }

  @Put()
  @Roles('admin')
  upsert(
    @CurrentUser() user: { org_id: string },
    @Body() dto: UpsertOrgScheduleConfigDto,
  ) {
    return this.service.upsert(user.org_id, dto);
  }
}
