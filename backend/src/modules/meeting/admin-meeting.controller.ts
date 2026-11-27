import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { AdminOnly, Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { AdminMeetingService } from './admin-meeting.service';

@Controller('admin/meetings')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@AdminOnly()
export class AdminMeetingController {
  constructor(private readonly adminMeetingService: AdminMeetingService) {}

  @Get('live')
  findLive(@CurrentUser('org_id') orgId: string) {
    return this.adminMeetingService.findLive(orgId);
  }

  @Get(':id/token')
  getToken(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminMeetingService.issueToken(id, orgId, adminId);
  }
}