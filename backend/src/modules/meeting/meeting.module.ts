import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  MeetingController,
  MeetingJoinController,
  StudentMeetingController,
} from './meeting.controller';
import { MeetingTokenController } from './meeting-token.controller';
import { AdminMeetingController } from './admin-meeting.controller';

import { MeetingService } from './meeting.service';
import { AdminMeetingService } from './admin-meeting.service';
import { MeetingRepository } from './meeting.repository';
import { MeetingGateway } from './meeting.gateway';
import { MeetingPresenceGateway } from './meeting-presence.gateway';
import { AgoraTokenService } from './agora-token.service';

import { ClassModule } from '../class/class.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import { GroupyCoreModule } from '../groupy/core/groupy-core.module';

@Module({
  imports: [
    ClassModule,
    NotificationModule,
    AuditLogModule,
    GroupyCoreModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '1d',
        },
      }),
    }),
  ],
  controllers: [
    MeetingController,
    MeetingJoinController,
    StudentMeetingController,
    MeetingTokenController,
    AdminMeetingController,
  ],
  providers: [
    MeetingService,
    AdminMeetingService,
    MeetingRepository,
    MeetingGateway,
    MeetingPresenceGateway,
    AgoraTokenService,
    EnrollmentRepository,
  ],
  exports: [MeetingService],
})
export class MeetingModule {}