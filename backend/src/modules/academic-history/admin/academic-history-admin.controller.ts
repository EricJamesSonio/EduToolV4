import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AcademicHistoryService } from '../academic-history.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('academic-history')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AcademicHistoryAdminController {
  constructor(private readonly service: AcademicHistoryService) {}

  @Get(':studentId')
  getFullHistory(
    @Param('studentId') studentId: string,
    @CurrentUser() user: { org_id: string; id: string },
  ) {
    return this.service.getFullHistory(studentId, user.org_id);
  }

  @Get(':studentId/timeline')
  getTimeline(
    @Param('studentId') studentId: string,
    @Query('schoolYearId') schoolYearId: string | undefined,
    @Query('sort') sort: 'asc' | 'desc' | undefined,
    @CurrentUser() user: { org_id: string; id: string },
  ) {
    return this.service.getTimeline(studentId, user.org_id, schoolYearId, sort ?? 'asc');
  }
}
