// src/domains/system/system-domain.module.ts
import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { OrgEnrollmentSettingModule } from '@/modules/org-enrollment-setting/org-enrollment-setting.module';

@Module({
  imports: [
    AuditLogModule,
    NotificationModule,
    AnalyticsModule,
    OrgEnrollmentSettingModule,
  ],
  exports: [AuditLogModule, NotificationModule, AnalyticsModule],
})
export class SystemDomainModule {}
