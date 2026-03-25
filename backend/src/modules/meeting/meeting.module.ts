import { Module } from '@nestjs/common';
import {
  MeetingController,
  MeetingJoinController,
  StudentMeetingController,
} from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from './meeting.repository';
import { ClassModule } from '../class/class.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [ClassModule, NotificationModule, AuditLogModule],
  controllers: [
    MeetingController,
    MeetingJoinController,
    StudentMeetingController,
  ],
  providers: [MeetingService, MeetingRepository],
  exports: [MeetingService],
})
export class MeetingModule {}