import { Module } from '@nestjs/common'
import { GradeLockController } from './grade-lock.controller'
import { GradeLockService } from './grade-lock.service'
import { GradeLockSettingsService } from './grade-lock-settings.service'
import { GradeLockOperationsService } from './grade-lock-operations.service'
import { GradeLockRequestsService } from './grade-lock-requests.service'
import { GradeLockAutoService } from './grade-lock-auto.service'
import { GradeLockRepository } from './grade-lock.repository'
import { GradeLockValidator } from './grade-lock.validator'
import { GradeEducatorModule } from '../grade/educator/grade-educator.module'
import { ClassModule } from '../class/class.module'
import { AuditLogModule } from '../audit-log/audit-log.module'

@Module({
  imports: [
    GradeEducatorModule,
    ClassModule,
    AuditLogModule,
  ],
  controllers: [GradeLockController],
  providers: [
    GradeLockService,
    GradeLockSettingsService,
    GradeLockOperationsService,
    GradeLockRequestsService,
    GradeLockAutoService,
    GradeLockRepository,
    GradeLockValidator,
  ],
  exports: [GradeLockService, GradeLockValidator],
})
export class GradeLockModule {}