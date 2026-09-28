import { Module } from '@nestjs/common';
import { GradingSchemeController } from './grading-scheme.controller';
import { GradingSchemeService } from './grading-scheme.service';
import { GradingSchemeTemplateModule } from '@/modules/grading-scheme-template/grading-scheme-template.module';
import { GradingSchemeCoreModule } from './core/grading-scheme-core.module';

@Module({
  imports: [GradingSchemeCoreModule, GradingSchemeTemplateModule],
  controllers: [GradingSchemeController],
  providers: [GradingSchemeService],
  exports: [GradingSchemeService, GradingSchemeCoreModule],
})
export class GradingSchemeModule {}
