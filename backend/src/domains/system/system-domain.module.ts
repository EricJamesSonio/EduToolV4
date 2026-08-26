// src/domains/system/system-domain.module.ts
import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { OrgEnrollmentSettingModule } from '@/modules/org-enrollment-setting/org-enrollment-setting.module';
import { OrgScheduleConfigModule } from '@/modules/org-schedule-config/org-schedule-config.module';

@Module({
  imports: [
    AuditLogModule,
    NotificationModule,
    AnalyticsModule,
    OrgEnrollmentSettingModule,
    OrgScheduleConfigModule,
  ],
  exports: [AuditLogModule, NotificationModule, AnalyticsModule, OrgScheduleConfigModule],
})
export class SystemDomainModule {}
