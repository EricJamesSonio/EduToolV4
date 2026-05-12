// Dashboard Repository
// Data access layer for dashboard data

import { Injectable } from '@nestjs/common';
import {
  DashboardStatsDto
} from './dto/dashboard-stats.dto';
import {
  AcademicContextDto,
  GradeLockStatus
} from './dto/academic-context.dto';
import {
  AlertDto,
  AlertType
} from './dto/alerts.dto';

@Injectable()
export class DashboardRepository {
  /**
   * Get dashboard statistics
   * Returns mock data for demonstration purposes
   */
  async getStats(): Promise<DashboardStatsDto> {
    // Mock data - in production this would query the database
    return {
      totalStudents: 1234,
      totalEducators: 89,
      activeClasses: 45,
      programs: 8,
      activeSchoolYear: '2025-2026',
      pendingGradeSubmissions: 43,
      sections: 67,
      pendingTasks: 12,
    };
  }

  /**
   * Get academic context information
   * Returns mock data for demonstration purposes
   */
  async getAcademicContext(): Promise<AcademicContextDto> {
    // Mock data - in production this would query the database
    return {
      schoolYear: '2025-2026',
      semester: '1st Semester',
      gradingPeriod: 'Midterm',
      gradeLockStatus: GradeLockStatus.DISABLED,
      gradeLockDate: '2025-12-15',
    };
  }

  /**
   * Get alerts and important notices
   * Returns mock data for demonstration purposes
   */
  async getAlerts(): Promise<AlertDto[]> {
    // Mock data - in production this would query the database
    return [
      {
        id: '1',
        type: AlertType.WARNING,
        message: '12 classes have no assigned educator',
        count: 12,
        actionUrl: '/admin/classes',
      },
      {
        id: '2',
        type: AlertType.WARNING,
        message: '43 grades pending submission',
        count: 43,
        actionUrl: '/admin/grades',
      },
      {
        id: '3',
        type: AlertType.INFO,
        message: 'Grade lock activates in 2 days',
        actionUrl: '/admin/grade-lock',
      },
      {
        id: '4',
        type: AlertType.ERROR,
        message: 'Students without sections',
        count: 28,
        actionUrl: '/admin/students',
      },
      {
        id: '5',
        type: AlertType.WARNING,
        message: 'Schedule conflicts detected',
        count: 5,
        actionUrl: '/admin/schedule',
      },
    ];
  }
}
