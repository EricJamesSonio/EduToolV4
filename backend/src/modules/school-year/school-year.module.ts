// @/modules/school-year/school-year.module.ts
import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';
import { SchoolYearRepository } from './school-year.repository';
import { LevelModule } from '@/modules/level/level.module';
import { SubjectModule } from '@/modules/subject/subject.module';
import { GradingScaleModule } from '../grading-scale/grading-scale.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    LevelModule,
    SubjectModule,
    GradingScaleModule,
    AuditLogModule,
  ],
  controllers: [SchoolYearController],
  providers: [SchoolYearService, SchoolYearRepository],
  exports: [SchoolYearService],
})
export class SchoolYearModule {}