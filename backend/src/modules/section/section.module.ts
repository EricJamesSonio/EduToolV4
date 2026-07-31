// @/modules/section/section.module.ts
import { Module } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { SectionRepository } from './section.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [SectionController],
  providers: [SectionService, SectionRepository],
  exports: [SectionService],
})
export class SectionModule {}