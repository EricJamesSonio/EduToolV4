import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { SubjectRepository } from './subject.repository';
import { OrgScheduleConfigModule } from '../org-schedule-config/org-schedule-config.module';
import { OrgScheduleConfigService } from '../org-schedule-config/org-schedule-config.service';
import { OrgScheduleConfigProvider } from '../org-schedule-config/schedule-window.provider';
import { EducatorPlanningModule } from '../educator/educator-planning.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  // OrgScheduleConfigModule provides OrgScheduleConfigService; the abstract
  // OrgScheduleConfigProvider token that SubjectService asks for is bound to it
  // here. A type-only import erases the runtime token, which Nest cannot
  // resolve at boot even though `tsc` and every unit test pass.
  imports: [OrgScheduleConfigModule, EducatorPlanningModule, AuditLogModule],
  controllers: [SubjectController],
  providers: [
    SubjectService,
    SubjectRepository,
    {
      provide: OrgScheduleConfigProvider,
      useExisting: OrgScheduleConfigService,
    },
  ],
  exports: [SubjectService, SubjectRepository],
})
export class SubjectModule {}
