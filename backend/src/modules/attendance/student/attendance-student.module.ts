// @/modules/attendance/student/attendance-student.module.ts
import { Module } from '@nestjs/common';
import { AttendanceStudentController } from './attendance-student.controller';
import { AttendanceStudentService } from './attendance-student.service';
import { AttendanceRepository } from '../attendance.repository';
import { ClassRepository } from '@/modules/class/class.repository';

@Module({
  imports: [],
  controllers: [AttendanceStudentController],
  providers: [AttendanceStudentService, AttendanceRepository, ClassRepository],
})
export class AttendanceStudentModule {}