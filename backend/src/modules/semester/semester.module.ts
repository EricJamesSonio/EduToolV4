// backend/src/modules/semester/semester.module.ts
import { Module } from '@nestjs/common';
import {
  SemesterController,
  StudentSemesterController,
} from './semester.controller';
import { SemesterService } from './semester.service';
import { SemesterRepository } from './semester.repository';

@Module({
  controllers: [SemesterController, StudentSemesterController],
  providers: [SemesterService, SemesterRepository],
  exports: [SemesterService],
})
export class SemesterModule {}
