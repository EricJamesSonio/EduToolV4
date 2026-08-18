import { Module, forwardRef } from '@nestjs/common';
import { GradingSchemeController } from './grading-scheme.controller';
import { GradingSchemeService } from './grading-scheme.service';
import { GradingSchemeRepository } from './grading-scheme.repository';
import { GradingSchemeTemplateModule } from '@/modules/grading-scheme-template/grading-scheme-template.module';

@Module({
  imports: [forwardRef(() => GradingSchemeTemplateModule)], // <-- forwardRef
  controllers: [GradingSchemeController],
  providers: [GradingSchemeService, GradingSchemeRepository],
  exports: [GradingSchemeService, GradingSchemeRepository],
})
export class GradingSchemeModule {}
