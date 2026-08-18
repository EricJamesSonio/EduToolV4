// src/modules/grade/educator/grade-educator.module.ts
import { Module } from '@nestjs/common';
import { GradeEducatorController } from './grade-educator.controller';
import { GradeEducatorService } from './grade-educator.service';
import { GradeRepository } from '../grade.repository';
import { GradeCoreModule } from '../core/grade-core.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
  imports: [GradeCoreModule, AuditLogModule],
  controllers: [GradeEducatorController],
  providers: [GradeEducatorService, GradeRepository],
  exports: [GradeEducatorService, GradeRepository],
})
export class GradeEducatorModule {}
