import { Module } from '@nestjs/common';
import { GradingSchemeController } from './grading-scheme.controller';
import { GradingSchemeService } from './grading-scheme.service';
import { GradingSchemeRepository } from './grading-scheme.repository';

@Module({
  controllers: [GradingSchemeController],
  providers: [GradingSchemeService, GradingSchemeRepository],
  exports: [GradingSchemeService], // consumed by ClassModule, GradeModule, ExportModule
})
export class GradingSchemeModule {}