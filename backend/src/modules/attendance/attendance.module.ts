import { Module, forwardRef } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AttendanceStudentModule } from './student/attendance-student.module';
import { LessonModule } from '../lesson/lesson.module';

@Module({
  imports: [
    AuditLogModule,
    AttendanceStudentModule,
    forwardRef(() => LessonModule), // 🔥 FIX: circular dependency resolved
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
  exports: [AttendanceService],
})
export class AttendanceModule {}