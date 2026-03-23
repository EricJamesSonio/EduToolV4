// src/modules/grading-scale/grading-scale.module.ts
import { Module } from '@nestjs/common';
import { GradingScaleController } from './grading-scale.controller';
import { GradingScaleService } from './grading-scale.service';
import { GradingScaleRepository } from './grading-scale.repository';

@Module({
  controllers: [GradingScaleController],
  providers: [GradingScaleService, GradingScaleRepository],
  exports: [GradingScaleService], // exported for Phase 3: grade lock trigger, grade computation
})
export class GradingScaleModule {}