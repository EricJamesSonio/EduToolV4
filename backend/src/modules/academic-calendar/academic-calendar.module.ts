// backend/src/modules/academic-calendar/academic-calendar.module.ts

import { Module } from '@nestjs/common';
import { DatabaseModule }              from '@/core/database/database.module';

// Existing
import { AcademicCalendarController }  from './academic-calendar.controller';
import { AcademicCalendarService }     from './academic-calendar.service';
import { AcademicCalendarRepository }  from './academic-calendar.repository';

// New
import { ProgramCalendarController }   from './program-calendar/program-calendar.controller';
import { ProgramCalendarService }      from './program-calendar/program-calendar.service';
import { ProgramCalendarRepository }   from './program-calendar/program-calendar.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AcademicCalendarController,
    ProgramCalendarController,
  ],
  providers: [
    // Existing
    AcademicCalendarService,
    AcademicCalendarRepository,
    // New
    ProgramCalendarService,
    ProgramCalendarRepository,
  ],
  exports: [
    AcademicCalendarService,
    ProgramCalendarService,   // ← exported so semester-template module can depend on it
  ],
})
export class AcademicCalendarModule {}