// @/modules/assessment/educator/assessment-educator.module.ts
import { Module } from '@nestjs/common';
import { AssessmentEducatorController } from './assessment-educator.controller';
import { AssessmentEducatorService } from './assessment-educator.service';
import { AssessmentCreationHelper } from './helpers/assessment-creation.helper';
import { AssessmentSubmissionHelper } from './helpers/assessment-submission.helper';
import { AssessmentGenerationHelper } from './assessment-generation.helper';
import { AssessmentCoreModule } from '../core/assessment-core.module';
import { GradeModule } from '@/modules/grade/grade.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { AttendanceModule } from '@/modules/attendance/attendance.module';
import { LessonModule } from '@/modules/lesson/lesson.module';
import { ClassModule } from '@/modules/class/class.module';

@Module({
  imports: [
    AssessmentCoreModule,
    GradeModule,
    AuditLogModule,
    NotificationModule,
    AttendanceModule,
    LessonModule,
    ClassModule,
  ],
  controllers: [AssessmentEducatorController],
  providers: [
    AssessmentEducatorService,
    AssessmentCreationHelper,
    AssessmentSubmissionHelper,
    AssessmentGenerationHelper,
  ],
  exports: [AssessmentEducatorService],
})
export class AssessmentEducatorModule {}
