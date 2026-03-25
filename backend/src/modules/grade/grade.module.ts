// src/modules/grade/grade.module.ts
import { Module } from '@nestjs/common';
import { GradeRepository } from './grade.repository';
import { GradeCoreModule } from './core/grade-core.module';
import { GradeEducatorModule } from './educator/grade-educator.module';
import { GradeStudentModule } from './student/grade-student.module';

@Module({
  imports: [
    GradeCoreModule,
    GradeEducatorModule,
    GradeStudentModule,
  ],
  providers: [GradeRepository],
  exports: [GradeRepository, GradeCoreModule, GradeEducatorModule],
})
export class GradeModule {}