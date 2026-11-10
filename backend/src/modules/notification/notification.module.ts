// @/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationEventsService } from './notification-events.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationEventsService,
  ],
  exports: [NotificationService, NotificationEventsService],
})
export class NotificationModule {}