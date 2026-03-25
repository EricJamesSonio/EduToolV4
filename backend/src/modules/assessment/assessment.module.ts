// @/modules/assessment/assessment.module.ts
import { Module } from '@nestjs/common';
import { AssessmentEducatorModule } from './educator/assessment-educator.module';
import { AssessmentStudentModule } from './student/assessment-student.module';
import { AssessmentCoreModule } from './core/assessment-core.module';

@Module({
  imports: [AssessmentCoreModule, AssessmentEducatorModule, AssessmentStudentModule],
  exports: [AssessmentEducatorModule, AssessmentCoreModule],
})
export class AssessmentModule {}