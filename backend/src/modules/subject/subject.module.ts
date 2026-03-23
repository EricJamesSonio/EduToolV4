// src/modules/subject/subject.module.ts
import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { SubjectRepository } from './subject.repository';

@Module({
  controllers: [SubjectController],
  providers: [SubjectService, SubjectRepository],
  exports: [SubjectService], // exported for Phase 3: class creation, school-year activation unlock
})
export class SubjectModule {}