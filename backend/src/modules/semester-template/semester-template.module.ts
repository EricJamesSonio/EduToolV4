// filepath: backend/src/modules/semester-template/semester-template.module.ts

import { Module } from '@nestjs/common'
import { SemesterTemplateController } from './semester-template.controller'
import { SemesterTemplateService }    from './semester-template.service'
import { SemesterTemplateRepository } from './semester-template.repository'

@Module({
  controllers: [SemesterTemplateController],
  providers:   [SemesterTemplateService, SemesterTemplateRepository],
  exports:     [SemesterTemplateService],
})
export class SemesterTemplateModule {}