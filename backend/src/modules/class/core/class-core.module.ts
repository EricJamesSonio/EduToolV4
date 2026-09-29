// src/modules/class/core/class-core.module.ts
// Shared repository provider. Exists so modules that only need class *data*
// (e.g. LessonModule -> ClassRepository) can depend on this leaf module
// instead of ClassModule, which would otherwise re-create the
// ClassModule -> AttendanceModule -> LessonModule -> ClassModule cycle.
import { Module } from '@nestjs/common';
import { ClassRepository } from '../class.repository';

@Module({
  providers: [ClassRepository],
  exports: [ClassRepository],
})
export class ClassCoreModule {}
