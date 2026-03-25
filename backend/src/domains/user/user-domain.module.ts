// src/domains/user/user-domain.module.ts
import { Module } from '@nestjs/common';

import { StudentModule } from '@/modules/student/student.module';
import { EducatorModule } from '@/modules/educator/educator.module';

@Module({
  imports: [StudentModule, EducatorModule],
  exports: [StudentModule, EducatorModule],
})
export class UserDomainModule {}