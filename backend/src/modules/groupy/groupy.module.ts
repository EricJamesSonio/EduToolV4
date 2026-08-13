import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { GroupyController } from './groupy.controller';
import { GroupyService } from './groupy.service';
import { GroupyRepository } from './groupy.repository';
import { GroupyGateway } from './groupy.gateway';
import { GiphyService } from './giphy.service';
import { MeetingModule } from '../meeting/meeting.module';

@Module({
  imports: [
    forwardRef(() => MeetingModule),
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
  controllers: [GroupyController],
  providers: [GroupyService, GroupyRepository, GroupyGateway, GiphyService],
  exports: [GroupyService, GroupyGateway],
})
export class GroupyModule {}