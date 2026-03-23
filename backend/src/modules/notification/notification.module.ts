// src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService], // exported for Phase 4: event listeners
})
export class NotificationModule {}