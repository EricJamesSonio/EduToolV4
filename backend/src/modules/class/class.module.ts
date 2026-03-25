// @/modules/class/class.module.ts
import { Module } from '@nestjs/common';
import { ClassController, StudentClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassRepository } from './class.repository';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EducatorClassController } from './class.controller';

@Module({
  imports: [AttendanceModule, AuditLogModule],
  controllers: [ClassController, StudentClassController, EducatorClassController],
  providers: [ClassService, ClassRepository],
  exports: [ClassService, ClassRepository],
})
export class ClassModule {}