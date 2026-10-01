import { Module } from '@nestjs/common';
import { ClassGeneratorController } from './class-generator.controller';
import { ClassGeneratorService } from './class-generator.service';
import { ClassModule } from '../class/class.module';
import { EducatorPlanningModule } from '../educator/educator-planning.module';
import { OrgScheduleConfigModule } from '../org-schedule-config/org-schedule-config.module';
import { SubjectModule } from '../subject/subject.module';

/**
 * The automated class generator.
 *
 * Depends on ClassModule for ClassService (so committed classes go through the
 * normal create path and inherit every rule), EducatorPlanningModule for the
 * teachable-subject and availability readers, and the org schedule config for
 * the operating window. None of these import back, so the graph stays acyclic.
 */
@Module({
  imports: [
    ClassModule,
    EducatorPlanningModule,
    OrgScheduleConfigModule,
    SubjectModule,
  ],
  controllers: [ClassGeneratorController],
  providers: [ClassGeneratorService],
  exports: [ClassGeneratorService],
})
export class ClassGeneratorModule {}