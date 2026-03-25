// @/modules/school-year/school-year.module.ts
import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { SchoolYearRepository } from './school-year.repository';
import { LevelModule } from '@/modules/level/level.module';
import { SubjectModule } from '@/modules/subject/subject.module';

@Module({
  imports: [
    LevelModule,   // for seeding level structure on school year creation
    SubjectModule, // for unlocking all subjects on school year activation
  ],
  controllers: [SchoolYearController],
  providers: [SchoolYearService, SchoolYearRepository],
  exports: [SchoolYearService],
})
export class SchoolYearModule {}