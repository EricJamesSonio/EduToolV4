// src/modules/academic-calendar/academic-calendar.module.ts
import { Module } from '@nestjs/common';
import { AcademicCalendarController } from './academic-calendar.controller';
import { AcademicCalendarService } from './academic-calendar.service';
import { AcademicCalendarRepository } from './academic-calendar.repository';

@Module({
  controllers: [AcademicCalendarController],
  providers: [AcademicCalendarService, AcademicCalendarRepository],
  exports: [AcademicCalendarService], // exported for Phase 3: class session generation, attendance
})
export class AcademicCalendarModule {}