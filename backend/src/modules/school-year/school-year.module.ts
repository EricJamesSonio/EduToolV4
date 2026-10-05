// @/modules/school-year/school-year.module.ts
import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { SchoolYearRepository } from './school-year.repository';
import { SchoolYearReadinessService } from './school-year-readiness.service';
import { LevelModule } from '@/modules/level/level.module';
import { SubjectModule } from '@/modules/subject/subject.module';
import { GradingScaleModule } from '../grading-scale/grading-scale.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
// NOTE: verify these two module files/exports match your project — they
// should export OrgSeederService and SchoolProfileService respectively,
// the same services already used by OrganizationService.
import { OrgSeederModule } from '@/modules/org-seeder/org-seeder.module';
import { SchoolProfileModule } from '@/modules/school-profile/school-profile.module';
import { ProgramModule } from '@/modules/program/program.module';

@Module({
  imports: [
    LevelModule,
    SubjectModule,
    GradingScaleModule,
    AuditLogModule,
    OrgSeederModule,
    SchoolProfileModule,
    // Reuses ProgramService.deleteProgramCascade — ProgramModule only depends
    // on AuditLogModule, so this introduces no cycle.
    ProgramModule,
  ],
  controllers: [SchoolYearController],
  providers: [
    SchoolYearService,
    SchoolYearRepository,
    SchoolYearReadinessService,
  ],
  exports: [SchoolYearService, SchoolYearReadinessService],
})
export class SchoolYearModule {}