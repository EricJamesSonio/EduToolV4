// src/modules/concern/staff/concern-staff.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConcernStaffService } from './concern-staff.service';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import {
  ReplyConcernDto,
  QueryStaffConcernDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/concern.dto';

@Controller('concerns/staff')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ConcernStaffController {
  constructor(private readonly service: ConcernStaffService) {}

  // GET /concerns/staff
  @Get()
  listAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryStaffConcernDto,
  ) {
    return this.service.listAll(orgId, query);
  }

  // GET /concerns/staff/:id
  @Get(':id')
  getOne(
    @CurrentUser('org_id') orgId: string,
    @Param('id') concernId: string,
  ) {
    return this.service.getOne(orgId, concernId);
  }

  // POST /concerns/staff/:id/reply
  @Post(':id/reply')
  reply(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('fullName') fullName: string,
    @Param('id') concernId: string,
    @Body() dto: ReplyConcernDto,
  ) {
    return this.service.reply({ orgId, accountId, role, fullName, concernId }, dto);
  }

  // PATCH /concerns/staff/:id/resolve
  @Patch(':id/resolve')
  resolve(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @Param('id') concernId: string,
  ) {
    return this.service.resolve(orgId, concernId, accountId);
  }

  // PATCH /concerns/staff/:id/reopen
  @Patch(':id/reopen')
  reopen(
    @CurrentUser('org_id') orgId: string,
    @Param('id') concernId: string,
  ) {
    return this.service.reopen(orgId, concernId);
  }
}