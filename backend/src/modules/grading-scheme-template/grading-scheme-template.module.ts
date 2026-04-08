// filepath: src/modules/grading-scheme-template/grading-scheme-template.module.ts

import { Module } from '@nestjs/common';
import { GradingSchemeTemplateController } from './grading-scheme-template.controller';
import { GradingSchemeTemplateService }    from './grading-scheme-template.service';
import { GradingSchemeTemplateRepository } from './grading-scheme-template.repository';

@Module({
  controllers: [GradingSchemeTemplateController],
  providers:   [GradingSchemeTemplateService, GradingSchemeTemplateRepository],
  exports:     [GradingSchemeTemplateService],
})
export class GradingSchemeTemplateModule {}