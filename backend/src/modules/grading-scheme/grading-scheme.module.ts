// filepath: src/modules/grading-scheme/grading-scheme.module.ts

import { Module } from '@nestjs/common';
import { GradingSchemeController }       from './grading-scheme.controller';
import { GradingSchemeService }          from './grading-scheme.service';
import { GradingSchemeRepository }       from './grading-scheme.repository';
import { GradingSchemeTemplateModule }   from '@/modules/grading-scheme-template/grading-scheme-template.module';

@Module({
  imports:     [GradingSchemeTemplateModule],
  controllers: [GradingSchemeController],
  providers:   [GradingSchemeService, GradingSchemeRepository],
  exports:     [GradingSchemeService],
})
export class GradingSchemeModule {}