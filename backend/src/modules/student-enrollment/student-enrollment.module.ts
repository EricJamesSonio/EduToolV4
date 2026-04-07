import { Module } from '@nestjs/common'
import { StudentEnrollmentController } from './student-enrollment.controller'
import { StudentEnrollmentService }    from './student-enrollment.service'
import { StudentEnrollmentRepository } from './student-enrollment.repository'

@Module({
  controllers: [StudentEnrollmentController],
  providers:   [StudentEnrollmentService, StudentEnrollmentRepository],
  exports:     [StudentEnrollmentService],
})
export class StudentEnrollmentModule {}