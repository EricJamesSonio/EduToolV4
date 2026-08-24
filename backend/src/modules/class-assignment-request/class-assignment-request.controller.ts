import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClassAssignmentRequestService } from './class-assignment-request.service';
import {
  CreateClassAssignmentRequestDto,
  FinalizeClassAssignmentRequestDto,
  ReopenClassAssignmentRequestDto,
} from './dto/class-assignment-request.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('class-assignment-requests')
@UseGuards(AuthGuard, RolesGuard)
export class ClassAssignmentRequestController {
  constructor(private readonly service: ClassAssignmentRequestService) {}

  @Post()
  @Roles('admin', 'student')
  create(
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: CreateClassAssignmentRequestDto,
  ) {
    return this.service.create(user.org_id, user.id, dto);
  }

  @Get()
  @Roles('admin', 'student')
  list(
    @CurrentUser() user: { org_id: string; id: string },
    @Query('studentId') studentId?: string,
    @Query('schoolYearId') schoolYearId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(
      user.org_id,
      { studentId, schoolYearId, status },
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @Roles('admin', 'student')
  getOne(@Param('id') id: string, @CurrentUser() user: { org_id: string; id: string }) {
    return this.service.findById(id, user.org_id);
  }

  @Patch(':id/finalize')
  @Roles('admin')
  finalize(
    @Param('id') id: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: FinalizeClassAssignmentRequestDto,
  ) {
    return this.service.finalize(id, user.org_id, user.id, dto);
  }

  @Patch(':id/reopen')
  @Roles('admin')
  reopen(
    @Param('id') id: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: ReopenClassAssignmentRequestDto,
  ) {
    return this.service.reopen(id, user.org_id, user.id, dto);
  }
}
