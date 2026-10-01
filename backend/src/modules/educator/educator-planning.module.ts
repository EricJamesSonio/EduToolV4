import { Module } from '@nestjs/common';
import { EducatorSubjectService } from './educator-subject.service';
import { EducatorSubjectRepository } from './educator-subject.repository';
import { EducatorScheduleProfileRepository } from './educator-schedule-profile.repository';
import { EducatorScheduleProfileService } from './educator-schedule-profile.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OrgScheduleConfigModule } from '../org-schedule-config/org-schedule-config.module';
import { OrgScheduleConfigService } from '../org-schedule-config/org-schedule-config.service';
import { OrgScheduleConfigProvider } from '../org-schedule-config/schedule-window.provider';

/**
 * Owns the two educator-facing planning attributes added for the automated
 * class generator: which subjects an educator can teach, and which weekdays
 * they are available.
 *
 * Deliberately standalone rather than living inside EducatorModule: the org
 * schedule config is needed here (to intersect weekdays), and EducatorModule
 * already pulls in ClassModule. Keeping it separate keeps the module graph
 * acyclic while still letting EducatorModule re-export these.
 * `DatabaseModule` is @Global, so no database import is needed.
 */
@Module({
  imports: [AuditLogModule, OrgScheduleConfigModule],
  providers: [
    EducatorSubjectService,
    EducatorSubjectRepository,
    EducatorScheduleProfileService,
    EducatorScheduleProfileRepository,
    // Bind the narrow contract to the real service so consumers depend on the
    // contract while Nest still has something concrete to inject.
    {
      provide: OrgScheduleConfigProvider,
      useExisting: OrgScheduleConfigService,
    },
  ],
  exports: [
    EducatorSubjectService,
    EducatorSubjectRepository,
    EducatorScheduleProfileService,
    EducatorScheduleProfileRepository,
    OrgScheduleConfigProvider,
  ],
})
export class EducatorPlanningModule {}

/**
 * Owns "which subjects an educator can teach".
 *
 * Deliberately its own module rather than living inside EducatorModule:
 * both the educator and the subject side need this service, and EducatorModule
 * already imports ClassModule. Putting it here keeps the graph acyclic.
 * `DatabaseModule` is @Global, so no database import is needed.
 */
@Module({
  imports: [AuditLogModule],
  providers: [EducatorSubjectService, EducatorSubjectRepository],
  exports: [EducatorSubjectService, EducatorSubjectRepository],
})
export class EducatorSubjectModule {}