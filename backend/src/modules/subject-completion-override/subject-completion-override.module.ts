// ===== File: backend\src\modules\subject-completion-override\subject-completion-override.module.ts =====
import { Module } from '@nestjs/common';
import { SubjectCompletionOverrideController } from './subject-completion-override.controller';
import { SubjectCompletionOverrideService } from './subject-completion-override.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GradingScaleModule } from '../grading-scale/grading-scale.module';

@Module({
  imports: [AuditLogModule, GradingScaleModule],
  controllers: [SubjectCompletionOverrideController],
  providers: [SubjectCompletionOverrideService],
  exports: [SubjectCompletionOverrideService],
})
export class SubjectCompletionOverrideModule {}