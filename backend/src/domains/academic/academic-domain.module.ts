import { Module } from '@nestjs/common';

import { AcademicCalendarModule } from '@/modules/academic-calendar/academic-calendar.module';
import { SchoolYearModule } from '@/modules/school-year/school-year.module';
import { SemesterModule } from '@/modules/semester/semester.module';
import { LevelModule } from '@/modules/level/level.module';
import { ProgramModule } from '@/modules/program/program.module';
import { SectionModule } from '@/modules/section/section.module';
import { SubjectModule } from '@/modules/subject/subject.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { ExportModule } from '@/modules/export/export.module';
import { MeetingModule } from '@/modules/meeting/meeting.module';
import { CourseModule } from '@/modules/course/course.module';
import { StrandModule } from '@/modules/strand/strand.module';
import { SubjectPrerequisiteModule } from '@/modules/subject-prerequisite/subject-prerequisite.module';
import { StudentEnrollmentModule } from '@/modules/student-enrollment/student-enrollment.module';
import { SemesterTemplateModule } from '@/modules/semester-template/semester-template.module';
import { GradingSchemeTemplateModule } from '@/modules/grading-scheme-template/grading-scheme-template.module';
import { SchoolProfileModule } from '@/modules/school-profile/school-profile.module';

@Module({
  imports: [
    AcademicCalendarModule,
    SchoolYearModule,
    SemesterModule,
    LevelModule,
    ProgramModule,
    SectionModule,
    SubjectModule,
    TranscriptModule,
    ExportModule,
    MeetingModule,
    CourseModule,
    StrandModule,
    SubjectPrerequisiteModule,
    StudentEnrollmentModule,
    SemesterTemplateModule,
    GradingSchemeTemplateModule,
    SchoolProfileModule,
  ],
  exports: [
    AcademicCalendarModule,
    SchoolYearModule,
    SemesterModule,
    LevelModule,
    ProgramModule,
    SectionModule,
    SubjectModule,
    TranscriptModule,
    ExportModule,
    MeetingModule,
    CourseModule,
    StrandModule,
    SubjectPrerequisiteModule,
    SemesterTemplateModule,
    SchoolProfileModule,
  ],
})
export class AcademicDomainModule {}
