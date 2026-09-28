// src/modules/groupy/core/groupy-core.module.ts
// Shared realtime/data providers for the Groupy domain. Exists so
// MeetingModule can inject GroupyGateway without importing GroupyModule,
// which would otherwise re-create the MeetingModule <-> GroupyModule cycle
// (GroupyService needs MeetingService).
//
// GroupyGateway must be instantiated exactly once: two instances would
// register the 'groupy' socket namespace twice.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { GroupyRepository } from '../groupy.repository';
import { GroupyGateway } from '../groupy.gateway';

@Module({
  imports: [
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
  providers: [GroupyRepository, GroupyGateway],
  exports: [GroupyRepository, GroupyGateway],
})
export class GroupyCoreModule {}
