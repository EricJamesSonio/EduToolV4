// @/modules/assessment/core/assessment-core.module.ts
import { Module } from '@nestjs/common';
import { AssessmentCoreService } from './assessment-core.service';
import { AssessmentRepository } from './assessment-core.repository';

@Module({
  providers: [AssessmentCoreService, AssessmentRepository],
  exports: [AssessmentCoreService, AssessmentRepository],
})
export class AssessmentCoreModule {}
