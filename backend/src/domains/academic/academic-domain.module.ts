// src/domains/academic/academic-domain.module.ts
import { Module } from '@nestjs/common';

import { AcademicCalendarModule } from '@/modules/academic-calendar/academic-calendar.module';
import { SchoolYearModule } from '@/modules/school-year/school-year.module';
import { SemesterModule } from '@/modules/semester/semester.module';
import { LevelModule } from '@/modules/level/level.module';
import { ProgramModule } from '@/modules/program/program.module';
import { SectionModule } from '@/modules/section/section.module';
import { SubjectModule } from '@/modules/subject/subject.module';

@Module({
  imports: [
    AcademicCalendarModule,
    SchoolYearModule,
    SemesterModule,
    LevelModule,
    ProgramModule,
    SectionModule,
    SubjectModule,
  ],
  exports: [
    AcademicCalendarModule,
    SchoolYearModule,
    SemesterModule,
    LevelModule,
    ProgramModule,
    SectionModule,
    SubjectModule,
  ],
})
export class AcademicDomainModule {}