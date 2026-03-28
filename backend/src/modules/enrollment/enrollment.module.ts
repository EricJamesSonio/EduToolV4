import { Module } from '@nestjs/common'
import { EnrollmentService } from './enrollment.service'
import { EnrollmentRepository } from './enrollment.repository'

@Module({
  providers: [EnrollmentService, EnrollmentRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}