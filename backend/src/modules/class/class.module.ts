import { Module, forwardRef } from '@nestjs/common';
import {
  ClassController,
  StudentClassController,
  EducatorClassController,
} from './class.controller';
import { ClassService } from './class.service';
import { ClassOccupancyService } from './class-occupancy.service';
import { ClassCoreModule } from './core/class-core.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GradingSchemeTemplateModule } from '../grading-scheme-template/grading-scheme-template.module';
import { SubjectPrerequisiteModule } from '../subject-prerequisite/subject-prerequisite.module';
import { OrgScheduleConfigModule } from '../org-schedule-config/org-schedule-config.module';

@Module({
  imports: [
    ClassCoreModule,
    EnrollmentModule,
    AuditLogModule,
    forwardRef(() => AttendanceModule),
    forwardRef(() => GradingSchemeTemplateModule),
    SubjectPrerequisiteModule,
    OrgScheduleConfigModule,
  ],
  controllers: [
    ClassController,
    StudentClassController,
    EducatorClassController,
  ],
  providers: [ClassService, ClassOccupancyService],
  exports: [ClassService, ClassCoreModule, ClassOccupancyService],
})
export class ClassModule {}