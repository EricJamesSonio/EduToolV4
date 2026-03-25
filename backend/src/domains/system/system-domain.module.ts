// src/domains/system/system-domain.module.ts
import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';

@Module({
  imports: [AuditLogModule, NotificationModule, AnalyticsModule],
  exports: [AuditLogModule, NotificationModule, AnalyticsModule],
})
export class SystemDomainModule {}