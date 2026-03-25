// @/modules/submission/submission.module.ts
import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { AssessmentModule } from '../assessment/assessment.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AssessmentModule, AttendanceModule],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionRepository],
  exports: [SubmissionService, SubmissionRepository],
})
export class SubmissionModule {}