// @/modules/submission/submission.module.ts
import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { AssessmentModule } from '../assessment/assessment.module';
import { AssessmentCoreModule } from '../assessment/core/assessment-core.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GradeEducatorModule } from '../grade/educator/grade-educator.module';

@Module({
  imports: [
    AssessmentModule,
    AssessmentCoreModule,
    AttendanceModule,
    GradeEducatorModule,
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionRepository],
  exports: [SubmissionService, SubmissionRepository],
})
export class SubmissionModule {}
