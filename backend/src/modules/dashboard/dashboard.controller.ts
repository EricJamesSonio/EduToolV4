// Dashboard Controller
// HTTP endpoints for dashboard API

import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { AcademicContextDto } from './dto/academic-context.dto';
import { AlertDto } from './dto/alerts.dto';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/statistics
   * Returns comprehensive dashboard statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(): Promise<DashboardStatsDto> {
    return await this.dashboardService.getStats();
  }

  /**
   * GET /dashboard/academic-context
   * Returns current academic context information
   */
  @Get('academic-context')
  @HttpCode(HttpStatus.OK)
  async getAcademicContext(): Promise<AcademicContextDto> {
    return await this.dashboardService.getAcademicContext();
  }

  /**
   * GET /dashboard/alerts
   * Returns alerts and important notices
   */
  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  async getAlerts(): Promise<AlertDto[]> {
    return await this.dashboardService.getAlerts();
  }
}
