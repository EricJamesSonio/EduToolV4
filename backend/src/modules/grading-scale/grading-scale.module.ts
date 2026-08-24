// @/modules/grading-scale/grading-scale.module.ts
import { Module } from '@nestjs/common';
import { GradingScaleController } from './grading-scale.controller';
import { GradingScaleService } from './grading-scale.service';
import { GradingScaleRepository } from './grading-scale.repository';
import { GradingScaleAssignmentRepository } from './grading-scale-assignment.repository';

@Module({
  controllers: [GradingScaleController],
  providers: [
    GradingScaleService,
    GradingScaleRepository,
    GradingScaleAssignmentRepository,
  ],
  exports: [GradingScaleService, GradingScaleRepository],
})
export class GradingScaleModule {}
