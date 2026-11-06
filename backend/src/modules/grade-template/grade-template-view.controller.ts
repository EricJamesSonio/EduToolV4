import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { GradeTemplateViewService } from './grade-template-view.service';

@Controller('grade-templates')
@UseGuards(AuthGuard, RolesGuard)
export class GradeTemplateViewController {
  constructor(private readonly service: GradeTemplateViewService) {}

  // GET /grade-templates/:id/view?sheet=&offset=&limit=
  @Get(':id/view')
  @Roles('admin')
  view(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Query('sheet') sheet?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.view(orgId, id, { sheet, offset, limit });
  }

  // GET /grade-templates/:id/view-all
  @Get(':id/view-all')
  @Roles('admin')
  viewAll(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.service.viewAll(orgId, id);
  }
}