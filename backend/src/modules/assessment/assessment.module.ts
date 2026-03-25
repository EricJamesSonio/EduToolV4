// src/modules/assessment/assessment.module.ts
import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AssessmentRepository } from './assessment.repository';
import { LessonModule } from '../lesson/lesson.module';
import { ClassModule } from '../class/class.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notification/notification.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [LessonModule, ClassModule, AuditLogModule, NotificationModule, AttendanceModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, AssessmentRepository],
  exports: [AssessmentService, AssessmentRepository],
})
export class AssessmentModule {}