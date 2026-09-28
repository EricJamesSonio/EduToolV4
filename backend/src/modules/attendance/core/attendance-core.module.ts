// src/modules/attendance/core/attendance-core.module.ts
// Shared repository provider. Exists so modules that only need attendance
// *data* (e.g. LessonModule -> AttendanceRepository) can depend on this leaf
// module instead of AttendanceModule, which would otherwise re-create the
// AttendanceModule <-> LessonModule cycle.
import { Module } from '@nestjs/common';
import { AttendanceRepository } from '../attendance.repository';

@Module({
  providers: [AttendanceRepository],
  exports: [AttendanceRepository],
})
export class AttendanceCoreModule {}
