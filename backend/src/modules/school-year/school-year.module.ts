// src/modules/school-year/school-year.module.ts
import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { SchoolYearRepository } from './school-year.repository';

@Module({
  controllers: [SchoolYearController],
  providers: [SchoolYearService, SchoolYearRepository],
  exports: [SchoolYearService], // exported for Phase 3: level seeding, semester scoping
})
export class SchoolYearModule {}