// src/modules/enrollment-portal/registrar/enrollment-registrar.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles, Registrar } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { EnrollmentRegistrarService } from './enrollment-registrar.service';
import {
  CreateEnrollmentPeriodDto,
  UpdateEnrollmentPeriodDto,
  QueryApplicationsDto,
  RejectApplicationDto,
  UnlockApplicationDto,
} from './dto/enrollment-registrar.dto';

interface RegistrarUser {
  id: string;
  org_id: string;
  role: string;
  is_registrar: boolean;
}

@Controller('admin/enrollment-portal')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Registrar()
export class EnrollmentRegistrarController {
  constructor(private readonly service: EnrollmentRegistrarService) {}

  // ── Periods ──────────────────────────────────────────────────────────────

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  createPeriod(@CurrentUser() user: RegistrarUser, @Body() dto: CreateEnrollmentPeriodDto) {
    return this.service.createPeriod(user.org_id, user.id, dto);
  }

  @Get('periods')
  @HttpCode(HttpStatus.OK)
  listPeriods(@CurrentUser() user: RegistrarUser) {
    return this.service.listPeriods(user.org_id);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  dashboard(
    @CurrentUser() user: RegistrarUser,
    @Query('period_id') periodId?: string,
  ) {
    return this.service.getDashboard(user.org_id, periodId);
  }

  @Patch('periods/:id')
  @HttpCode(HttpStatus.OK)
  updatePeriod(
    @CurrentUser() user: RegistrarUser,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentPeriodDto,
  ) {
    return this.service.updatePeriod(user.org_id, user.id, id, dto);
  }

  @Delete('periods/:id')
  @HttpCode(HttpStatus.OK)
  deletePeriod(@CurrentUser() user: RegistrarUser, @Param('id') id: string) {
    return this.service.deletePeriod(user.org_id, user.id, id);
  }

  // ── Applications ─────────────────────────────────────────────────────────

  @Get('applications')
  @HttpCode(HttpStatus.OK)
  searchApplications(
    @CurrentUser() user: RegistrarUser,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.service.searchApplications(user.org_id, query);
  }

  @Get('applications/:id')
  @HttpCode(HttpStatus.OK)
  getApplication(@CurrentUser() user: RegistrarUser, @Param('id') id: string) {
    return this.service.getApplicationDetail(user.org_id, id);
  }

  @Post('applications/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@CurrentUser() user: RegistrarUser, @Param('id') id: string) {
    return this.service.approveApplication(user.org_id, user.id, id);
  }

  @Post('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: RegistrarUser,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.service.rejectApplication(user.org_id, user.id, id, dto);
  }

  @Post('applications/unlock')
  @HttpCode(HttpStatus.OK)
  unlock(@CurrentUser() user: RegistrarUser, @Body() dto: UnlockApplicationDto) {
    return this.service.unlockApplication(user.org_id, user.id, dto);
  }
}