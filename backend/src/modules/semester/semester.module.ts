// @/modules/semester/semester.module.ts
import { Module } from '@nestjs/common';
import { SemesterController } from './semester.controller';
import { SemesterService } from './semester.service';
import { SemesterRepository } from './semester.repository';

@Module({
  controllers: [SemesterController],
  providers: [SemesterService, SemesterRepository],
  exports: [SemesterService], // exported for Phase 3: class, academic-calendar scoping
})
export class SemesterModule {}