import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './enrollment.repository';
import { SemesterEnrollmentService } from './semester-enrollment.service';
import { SubjectPrerequisiteModule } from '../subject-prerequisite/subject-prerequisite.module';

@Module({
  imports: [SubjectPrerequisiteModule],
  providers: [EnrollmentService, EnrollmentRepository, SemesterEnrollmentService],
  exports: [EnrollmentService, EnrollmentRepository, SemesterEnrollmentService],
})
export class EnrollmentModule {}