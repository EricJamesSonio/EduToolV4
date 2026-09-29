import { Module } from '@nestjs/common';
import { GradingSchemeTemplateController } from './grading-scheme-template.controller';
import { GradingSchemeTemplateService } from './grading-scheme-template.service';
import { GradingSchemeTemplateRepository } from './grading-scheme-template.repository';
import { GradingSchemeCoreModule } from '../grading-scheme/core/grading-scheme-core.module';
import { GradeEducatorModule } from '@/modules/grade/educator/grade-educator.module';

@Module({
  imports: [GradingSchemeCoreModule, GradeEducatorModule],
  controllers: [GradingSchemeTemplateController],
  providers: [GradingSchemeTemplateService, GradingSchemeTemplateRepository],
  exports: [GradingSchemeTemplateService, GradingSchemeTemplateRepository],
})
export class GradingSchemeTemplateModule {}
