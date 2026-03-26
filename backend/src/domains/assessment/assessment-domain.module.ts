// src/domains/assessment/assessment-domain.module.ts
import { Module } from '@nestjs/common';

import { AssessmentModule } from '@/modules/assessment/assessment.module';
import { SubmissionModule } from '@/modules/submission/submission.module';
import { RubricModule } from '@/modules/rubric/rubric.module';
import { GradeModule } from '@/modules/grade/grade.module';
import { GradingScaleModule } from '@/modules/grading-scale/grading-scale.module';
import { GradeLockModule } from '@/modules/grade-lock/grade-lock.module';

@Module({
  imports: [
    AssessmentModule,
    SubmissionModule,
    RubricModule,
    GradeModule,
    GradingScaleModule,
    GradeLockModule,
  ],
  exports: [
    AssessmentModule,
    SubmissionModule,
    RubricModule,
    GradeModule,
    GradingScaleModule,
    GradeLockModule,
  ],
})
export class AssessmentDomainModule {}