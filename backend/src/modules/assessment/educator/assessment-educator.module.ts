// @/modules/assessment/educator/assessment-educator.module.ts
import { Module } from '@nestjs/common';
import { AssessmentEducatorController } from './assessment-educator.controller';
import { AssessmentEducatorService } from './assessment-educator.service';
import { AssessmentCoreModule } from '../core/assessment-core.module';
import { LessonModule } from '@/modules/lesson/lesson.module';
import { ClassModule } from '@/modules/class/class.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { AttendanceModule } from '@/modules/attendance/attendance.module';

@Module({
  imports: [AssessmentCoreModule, LessonModule, ClassModule, AuditLogModule, NotificationModule, AttendanceModule],
  controllers: [AssessmentEducatorController],
  providers: [AssessmentEducatorService],
  exports: [AssessmentEducatorService],
})
export class AssessmentEducatorModule {}