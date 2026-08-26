import { Module } from '@nestjs/common';
import { OrgScheduleConfigController } from './org-schedule-config.controller';
import { OrgScheduleConfigService } from './org-schedule-config.service';
import { OrgScheduleConfigRepository } from './org-schedule-config.repository';

@Module({
  controllers: [OrgScheduleConfigController],
  providers: [OrgScheduleConfigService, OrgScheduleConfigRepository],
  exports: [OrgScheduleConfigService],
})
export class OrgScheduleConfigModule {}
