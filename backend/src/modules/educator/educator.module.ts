// src/modules/educator/educator.module.ts
import { Module } from '@nestjs/common';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';
import { EducatorRepository } from './educator.repository';

@Module({
  controllers: [EducatorController],
  providers: [EducatorService, EducatorRepository],
  exports: [EducatorService], // exported for Phase 3: class removal block, class assignment
})
export class EducatorModule {}