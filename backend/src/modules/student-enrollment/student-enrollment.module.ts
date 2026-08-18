import { Module } from '@nestjs/common';
import { StudentEnrollmentController } from './student-enrollment.controller';
import { StudentEnrollmentService } from './student-enrollment.service';
import { StudentEnrollmentRepository } from './student-enrollment.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SectionModule } from '../section/section.module';
import { SchoolYearModule } from '../school-year/school-year.module';

@Module({
  imports: [AuditLogModule, SectionModule, SchoolYearModule],
  controllers: [StudentEnrollmentController],
  providers: [StudentEnrollmentService, StudentEnrollmentRepository],
  exports: [StudentEnrollmentService],
})
export class StudentEnrollmentModule {}
