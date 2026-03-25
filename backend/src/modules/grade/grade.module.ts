// src/modules/grade/grade.module.ts
import { Module } from '@nestjs/common';
import { GradeController } from './grade.controller';
import { GradeService } from './grade.service';
import { GradeRepository } from './grade.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [GradeController],
  providers: [GradeService, GradeRepository],
  exports: [GradeService, GradeRepository],
})
export class GradeModule {}