import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './enrollment.repository';
import { SubjectPrerequisiteModule } from '../subject-prerequisite/subject-prerequisite.module';

@Module({
  imports: [SubjectPrerequisiteModule],
  providers: [EnrollmentService, EnrollmentRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}
