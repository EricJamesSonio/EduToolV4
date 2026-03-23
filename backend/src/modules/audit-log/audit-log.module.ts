// src/modules/audit-log/audit-log.module.ts
import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from './audit-log.repository';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogRepository],
  exports: [AuditLogService], // exported for Phase 4: event listeners
})
export class AuditLogModule {}