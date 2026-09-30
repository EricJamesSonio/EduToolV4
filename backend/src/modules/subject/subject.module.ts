import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { SubjectRepository } from './subject.repository';
import { OrgScheduleConfigModule } from '../org-schedule-config/org-schedule-config.module';
import { EducatorPlanningModule } from '../educator/educator-planning.module';

@Module({
  // Needed only for the org's slot length, which `session_minutes` must be a
  // multiple of. OrgScheduleConfigModule exports that service.
  // EducatorPlanningModule serves GET /subjects/:id/educators.
  imports: [OrgScheduleConfigModule, EducatorPlanningModule],
  controllers: [SubjectController],
  providers: [SubjectService, SubjectRepository],
  exports: [SubjectService, SubjectRepository],
})
export class SubjectModule {}
