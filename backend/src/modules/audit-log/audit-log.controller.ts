// @/modules/audit-log/audit-log.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto, QueryActivityLogDto } from './dto/audit-log.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-log  @Roles(ADMIN)
   * Returns high-impact administrative action logs for the org.
   * Filterable by date range, action type, entity type, entity ID, actor.
   */
  @Get('audit-log')
  @Roles('admin')
  async getAuditLog(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.findAdminLogs(orgId, query);
  }

  /**
   * GET /activity-log?classId=  @Roles(EDUCATOR, ADMIN)
   * Returns per-class educator activity logs.
   * Educators see logs for their own classes; Admin sees all.
   */
  @Get('activity-log')
  @Roles('educator', 'admin')
  async getActivityLog(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryActivityLogDto,
  ) {
    return this.auditLogService.findActivityLogs(orgId, query);
  }
}
