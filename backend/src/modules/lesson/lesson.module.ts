import { Module, forwardRef } from '@nestjs/common';
import { LessonController, StudentLessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonRepository } from './lesson.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notification/notification.module';
import { SemesterTemplateModule } from '../semester-template/semester-template.module';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import { ClassModule } from '../class/class.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    forwardRef(() => ClassModule),
    forwardRef(() => AttendanceModule),
    AuditLogModule,
    NotificationModule,
    SemesterTemplateModule,
  ],
  controllers: [LessonController, StudentLessonController],
  providers: [LessonService, LessonRepository, EnrollmentRepository],
  exports: [LessonService, LessonRepository],
})
export class LessonModule {}