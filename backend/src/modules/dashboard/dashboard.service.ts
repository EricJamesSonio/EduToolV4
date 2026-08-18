// Dashboard Service
// Business logic for dashboard operations

import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { AcademicContextDto } from './dto/academic-context.dto';
import { AlertDto } from './dto/alerts.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  /**
   * Get dashboard statistics
   * Returns comprehensive statistics for the admin dashboard
   */
  async getStats(): Promise<DashboardStatsDto> {
    try {
      return await this.dashboardRepository.getStats();
    } catch (error) {
      throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
    }
  }

  /**
   * Get academic context information
   * Returns current academic year, semester, and grading period information
   */
  async getAcademicContext(): Promise<AcademicContextDto> {
    try {
      return await this.dashboardRepository.getAcademicContext();
    } catch (error) {
      throw new Error(`Failed to fetch academic context: ${error.message}`);
    }
  }

  /**
   * Get alerts and important notices
   * Returns list of alerts that need admin attention
   */
  async getAlerts(): Promise<AlertDto[]> {
    try {
      return await this.dashboardRepository.getAlerts();
    } catch (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  }
}
