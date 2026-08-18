// src/modules/concern/student/concern-student.module.ts
import { Module } from '@nestjs/common';
import { ConcernStudentController } from './concern-student.controller';
import { ConcernStudentService } from './concern-student.service';
import { ConcernCoreModule } from '../core/concern-core.module';
import { ConcernDigestModule } from '../digest/concern-digest.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [ConcernCoreModule, ConcernDigestModule, NotificationModule],
  controllers: [ConcernStudentController],
  providers: [ConcernStudentService],
})
export class ConcernStudentModule {}
