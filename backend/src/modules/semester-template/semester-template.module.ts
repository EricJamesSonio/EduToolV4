import { Module } from '@nestjs/common'
import { ProgramModule } from '@/modules/program/program.module'
import { SemesterTemplateController } from './semester-template.controller'
import { SemesterTemplateService } from './semester-template.service'
import { SemesterTemplateRepository } from './semester-template.repository'

@Module({
  imports: [ProgramModule],  // ← Import ProgramModule to access ProgramRepository
  controllers: [SemesterTemplateController],
  providers: [SemesterTemplateService, SemesterTemplateRepository],
  exports: [SemesterTemplateService, SemesterTemplateRepository],
})
export class SemesterTemplateModule {}