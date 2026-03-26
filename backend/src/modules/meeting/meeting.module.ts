import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MeetingController,
  MeetingJoinController,
  StudentMeetingController,
} from './meeting.controller';
import { MeetingTokenController } from './meeting-token.controller';  // 👈 new
import { MeetingService } from './meeting.service';
import { MeetingRepository } from './meeting.repository';
import { MeetingGateway } from './meeting.gateway';               // 👈 new
import { AgoraTokenService } from './agora-token.service';        // 👈 new
import { ClassModule } from '../class/class.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
 
// @Module decorator shown below — copy this whole file over your existing meeting.module.ts
 
export const MeetingModuleDefinition = {
  imports: [
    ClassModule,
    NotificationModule,
    AuditLogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    MeetingController,
    MeetingJoinController,
    StudentMeetingController,
    MeetingTokenController,  // 👈 new — handles GET /meetings/:id/token
  ],
  providers: [
    MeetingService,
    MeetingRepository,
    MeetingGateway,      // 👈 new
    AgoraTokenService,   // 👈 new
  ],
  exports: [MeetingService],
};