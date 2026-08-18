import { Module } from '@nestjs/common';
import { OrgEnrollmentSettingController } from './org-enrollment-setting.controller';
import { OrgEnrollmentSettingService } from './org-enrollment-setting.service';
import { OrgEnrollmentSettingRepository } from './org-enrollment-setting.repository';

@Module({
  controllers: [OrgEnrollmentSettingController],
  providers: [OrgEnrollmentSettingService, OrgEnrollmentSettingRepository],
  exports: [OrgEnrollmentSettingService],
})
export class OrgEnrollmentSettingModule {}
