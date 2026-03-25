// @/modules/assessment/assessment.module.ts
import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AssessmentRepository } from './assessment.repository';
import { LessonModule } from '../lesson/lesson.module';
import { ClassModule } from '../class/class.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notification/notification.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AssessmentStudentController } from './assessment.student.controller';
import { AssessmentStudentService } from './assessment.student.service';
import { AssessmentCoreService } from './assessment.core.service';

@Module({
  imports: [LessonModule, ClassModule, AuditLogModule, NotificationModule, AttendanceModule],
  controllers: [AssessmentController, AssessmentStudentController],
  providers: [AssessmentService, AssessmentRepository, AssessmentStudentService, AssessmentCoreService],
  exports: [AssessmentService, AssessmentRepository],
})
export class AssessmentModule {}