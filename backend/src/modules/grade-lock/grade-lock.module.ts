// @/modules/grade-lock/grade-lock.module.ts
import { Module } from '@nestjs/common';
import { GradeLockController } from './grade-lock.controller';
import { GradeLockService } from './grade-lock.service';
import { GradeLockRepository } from './grade-lock.repository';

import { GradeEducatorModule } from '../grade/educator/grade-educator.module'; // 👈 updated
import { ClassModule } from '../class/class.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    GradeEducatorModule, // 👈 updated — exports GradeEducatorService + GradeRepository
    ClassModule,
    AuditLogModule,
  ],
  exports : [GradeLockService],
  controllers: [GradeLockController],
  providers: [GradeLockService, GradeLockRepository],
})
export class GradeLockModule {}