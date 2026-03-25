// @/modules/assessment/assessment.module.ts
import { Module } from '@nestjs/common';
import { AssessmentEducatorModule } from './educator/assessment-educator.module';
import { AssessmentStudentModule } from './student/assessment-student.module';

@Module({
  imports: [AssessmentEducatorModule, AssessmentStudentModule],
  exports: [AssessmentEducatorModule],
})
export class AssessmentModule {}