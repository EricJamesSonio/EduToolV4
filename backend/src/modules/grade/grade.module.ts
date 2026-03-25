// src/modules/grade/grade.module.ts
import { Module } from '@nestjs/common';
import { GradeCoreModule } from './core/grade-core.module';
import { GradeEducatorModule } from './educator/grade-educator.module';
import { GradeStudentModule } from './student/grade-student.module';

@Module({
  imports: [
    GradeCoreModule,
    GradeEducatorModule,
    GradeStudentModule,
  ],
  exports: [GradeCoreModule, GradeEducatorModule],
})
export class GradeModule {}