// @/modules/analytics/analytics.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import {
  GradeAnalyticsQueryDto,
} from './dto/analytics.dto';

@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── Dashboard Overview ─────────────────────────────────────

  @Get('overview')
  async getOverview(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.analyticsService.getOverview(orgId, schoolYearId);
  }

  // ── Enrollment Breakdown ───────────────────────────────────

  @Get('enrollment')
  async getEnrollment(
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.analyticsService.getEnrollmentBreakdown(orgId);
  }

  // ── Grade Analytics (LOCKED ONLY) ──────────────────────────

  @Get('grades')
  async getGrades(
    @CurrentUser('org_id') orgId: string,
    @Query() query: GradeAnalyticsQueryDto,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.analyticsService.getGradeAnalytics(orgId, query, schoolYearId);
  }

  // ── Educator Load ──────────────────────────────────────────

  @Get('educators')
  async getEducators(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.analyticsService.getEducatorLoad(orgId, schoolYearId);
  }

  // ── Alerts ─────────────────────────────────────────────────

  @Get('alerts')
  async getAlerts(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.analyticsService.getAlerts(orgId, schoolYearId);
  }
}