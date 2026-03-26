// @/modules/attendance/attendance.module.ts
import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AttendanceStudentModule } from './student/attendance-student.module';

@Module({
  imports: [AuditLogModule, AttendanceStudentModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
  exports: [AttendanceService],
})
export class AttendanceModule {}