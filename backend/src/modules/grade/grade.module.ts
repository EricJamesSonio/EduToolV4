// src/modules/grade/grade.module.ts
import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeRepository } from './grade.repository';

@Module({
  providers: [GradeService, GradeRepository],
  exports: [GradeService, GradeRepository],
})
export class GradeModule {}