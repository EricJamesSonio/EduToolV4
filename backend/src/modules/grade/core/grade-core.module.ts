// src/modules/grade/core/grade-core.module.ts
import { Module } from '@nestjs/common';
import { GradeCoreService } from './grade-core.service';

@Module({
  providers: [GradeCoreService],
  exports: [GradeCoreService],
})
export class GradeCoreModule {}