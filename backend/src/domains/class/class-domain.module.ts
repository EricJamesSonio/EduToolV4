// src/domains/class/class-domain.module.ts
import { Module } from '@nestjs/common'

import { ClassModule } from '@/modules/class/class.module'
import { LessonModule } from '@/modules/lesson/lesson.module'
import { AttendanceModule } from '@/modules/attendance/attendance.module'
import { SubjectPrerequisiteModule } from '@/modules/subject-prerequisite/subject-prerequisite.module'

@Module({
  imports: [ClassModule, LessonModule, AttendanceModule, SubjectPrerequisiteModule],
  exports: [ClassModule, LessonModule, AttendanceModule, SubjectPrerequisiteModule],
})
export class ClassDomainModule {}