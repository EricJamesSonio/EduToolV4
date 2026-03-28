import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  MeetingController,
  MeetingJoinController,
  StudentMeetingController,
} from './meeting.controller';
import { MeetingTokenController } from './meeting-token.controller';

import { MeetingService } from './meeting.service';
import { MeetingRepository } from './meeting.repository';
import { MeetingGateway } from './meeting.gateway';
import { AgoraTokenService } from './agora-token.service';

import { ClassModule } from '../class/class.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';

@Module({
  imports: [
    ClassModule,
    NotificationModule,
    AuditLogModule,
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
  ],
  providers: [
    MeetingService,
    MeetingRepository,
    MeetingGateway,
    AgoraTokenService,
    EnrollmentRepository
  ],
  exports: [MeetingService],
})
export class MeetingModule {}