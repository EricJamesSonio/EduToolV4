// @/modules/section/section.module.ts
import { Module } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { SectionRepository } from './section.repository';

@Module({
  controllers: [SectionController],
  providers: [SectionService, SectionRepository],
  exports: [SectionService], // exported for Phase 3: student capacity enforcement
})
export class SectionModule {}