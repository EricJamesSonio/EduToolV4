import { Module } from '@nestjs/common';
import {
  ClassController,
  StudentClassController,
  EducatorClassController,
} from './class.controller';
import { ClassService } from './class.service';
import { ClassRepository } from './class.repository';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [EnrollmentModule, AuditLogModule, AttendanceModule],
  controllers: [
    ClassController,
    StudentClassController,
    EducatorClassController,
  ],
  providers: [ClassService, ClassRepository],
  exports: [ClassService, ClassRepository],
})
export class ClassModule {}