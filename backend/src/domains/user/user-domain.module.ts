// src/domains/user/user-domain.module.ts
import { Module } from '@nestjs/common';

import { StudentModule } from '@/modules/student/student.module';
import { EducatorModule } from '@/modules/educator/educator.module';
import { RegistrarModule } from '@/modules/registrar/registrar.module';

@Module({
  imports: [StudentModule, EducatorModule, RegistrarModule],
  exports: [StudentModule, EducatorModule, RegistrarModule],
})
export class UserDomainModule {}