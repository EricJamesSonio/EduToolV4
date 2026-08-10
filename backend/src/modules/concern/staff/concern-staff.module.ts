// src/modules/concern/staff/concern-staff.module.ts
import { Module } from '@nestjs/common';
import { ConcernStaffController } from './concern-staff.controller';
import { ConcernStaffService } from './concern-staff.service';
import { ConcernCoreModule } from '../core/concern-core.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [ConcernCoreModule, NotificationModule],
  controllers: [ConcernStaffController],
  providers: [ConcernStaffService],
})
export class ConcernStaffModule {}