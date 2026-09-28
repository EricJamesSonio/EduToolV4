// src/modules/grading-scheme/core/grading-scheme-core.module.ts
// Shared repository provider. Exists so GradingSchemeTemplateModule can depend
// on the repository alone instead of GradingSchemeModule, which would
// otherwise re-create the GradingSchemeModule <-> GradingSchemeTemplateModule
// cycle (GradingSchemeService needs GradingSchemeTemplateService).
import { Module } from '@nestjs/common';
import { GradingSchemeRepository } from '../grading-scheme.repository';

@Module({
  providers: [GradingSchemeRepository],
  exports: [GradingSchemeRepository],
})
export class GradingSchemeCoreModule {}
