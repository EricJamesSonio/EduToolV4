import { Module, forwardRef } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AttendanceStudentModule } from './student/attendance-student.module';
import { AttendanceCoreModule } from './core/attendance-core.module';
import { LessonModule } from '../lesson/lesson.module';

@Module({
  imports: [
    AttendanceCoreModule,
    AuditLogModule,
    AttendanceStudentModule,
    forwardRef(() => LessonModule),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService, AttendanceCoreModule],
})
export class AttendanceModule {}
