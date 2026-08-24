import { Module } from '@nestjs/common';
import { ProgramShiftController } from './program-shift.controller';
import { ProgramShiftService } from './program-shift.service';
import { ProgramShiftRepository } from './program-shift.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SchoolYearModule } from '../school-year/school-year.module';
import { SectionModule } from '../section/section.module';
import { OrgEnrollmentSettingModule } from '../org-enrollment-setting/org-enrollment-setting.module';

@Module({
  imports: [AuditLogModule, SchoolYearModule, SectionModule, OrgEnrollmentSettingModule],
  controllers: [ProgramShiftController],
  providers: [ProgramShiftService, ProgramShiftRepository],
  exports: [ProgramShiftService],
})
export class ProgramShiftModule {}
