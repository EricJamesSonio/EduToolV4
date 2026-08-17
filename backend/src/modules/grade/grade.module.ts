// src/modules/grade/grade.module.ts
import { Module } from '@nestjs/common';
import { GradeCoreModule } from './core/grade-core.module';
import { GradeEducatorModule } from './educator/grade-educator.module';
import { GradeStudentModule } from './student/grade-student.module';
import { GradeRepository } from './grade.repository';

@Module({
  imports: [GradeCoreModule, GradeEducatorModule, GradeStudentModule],
  providers: [GradeRepository],
  exports: [GradeCoreModule, GradeEducatorModule, GradeRepository],
})
export class GradeModule {}
