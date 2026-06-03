import { Module, forwardRef } from '@nestjs/common';
import { LessonController, StudentLessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonConceptService } from './lesson-concept.service';
import { LessonWeekStructureService } from './lesson-week-structure.service';
import { LessonStudentService } from './lesson-student.service';
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
  providers: [
    LessonService,
    LessonConceptService,
    LessonWeekStructureService,
    LessonStudentService,
    LessonRepository,
    EnrollmentRepository,
  ],
  exports: [LessonService, LessonRepository],
})
export class LessonModule {}