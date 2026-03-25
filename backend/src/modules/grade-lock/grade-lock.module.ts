import { Module } from '@nestjs/common';
import { GradeLockController } from './grade-lock.controller';
import { GradeLockService } from './grade-lock.service';
import { GradeLockRepository } from './grade-lock.repository';

import { GradeModule } from '../grade/grade.module'; 
import { ClassModule } from '../class/class.module';
import { AuditLogModule } from '../audit-log/audit-log.module'; 

@Module({
  imports: [
    GradeModule,
    ClassModule,
    AuditLogModule, // ✅ FIX
  ],
  controllers: [GradeLockController],
  providers: [GradeLockService, GradeLockRepository],
})
export class GradeLockModule {}