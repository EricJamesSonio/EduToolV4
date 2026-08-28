import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentRepository } from './enrollment.repository';
import { GradingScaleModule } from '../grading-scale/grading-scale.module';

@Module({
  imports: [GradingScaleModule],
  providers: [EnrollmentService, EnrollmentRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}
