import { Module } from '@nestjs/common';
import { AttendanceStudentController } from './attendance-student.controller';
import { AttendanceStudentService } from './attendance-student.service';
import { AttendanceRepository } from '../attendance.repository';
import { ClassRepository } from '@/modules/class/class.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository'; // <-- import it

@Module({
  imports: [],
  controllers: [AttendanceStudentController],
  providers: [
    AttendanceStudentService,
    AttendanceRepository,
    ClassRepository,
    EnrollmentRepository, // <-- add here
  ],
})
export class AttendanceStudentModule {}