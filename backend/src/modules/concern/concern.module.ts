// src/modules/concern/concern.module.ts
import { Module } from '@nestjs/common';
import { ConcernCoreModule } from './core/concern-core.module';
import { ConcernStudentModule } from './student/concern-student.module';
import { ConcernStaffModule } from './staff/concern-staff.module';
import { ConcernCategoryModule } from './category/concern-category.module';

@Module({
  imports: [
    ConcernCoreModule,
    ConcernStaffModule,
    ConcernStudentModule,
    ConcernCategoryModule,
  ],
  exports: [ConcernCoreModule, ConcernStudentModule, ConcernStaffModule],
})
export class ConcernModule {}