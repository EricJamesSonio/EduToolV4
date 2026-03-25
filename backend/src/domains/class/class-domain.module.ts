// src/domains/class/class-domain.module.ts
import { Module } from '@nestjs/common';

import { ClassModule } from '@/modules/class/class.module';
import { LessonModule } from '@/modules/lesson/lesson.module';
import { AttendanceModule } from '@/modules/attendance/attendance.module';

@Module({
  imports: [ClassModule, LessonModule, AttendanceModule],
  exports: [ClassModule, LessonModule, AttendanceModule],
})
export class ClassDomainModule {}