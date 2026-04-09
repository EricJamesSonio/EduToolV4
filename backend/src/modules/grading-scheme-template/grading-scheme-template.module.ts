import { Module, forwardRef } from '@nestjs/common';
import { GradingSchemeTemplateController } from './grading-scheme-template.controller';
import { GradingSchemeTemplateService } from './grading-scheme-template.service';
import { GradingSchemeTemplateRepository } from './grading-scheme-template.repository';
import { GradingSchemeModule } from '../grading-scheme/grading-scheme.module';

@Module({
  imports: [forwardRef(() => GradingSchemeModule)], // <-- forwardRef
  controllers: [GradingSchemeTemplateController],
  providers: [GradingSchemeTemplateService, GradingSchemeTemplateRepository],
  exports: [GradingSchemeTemplateService],
})
export class GradingSchemeTemplateModule {}