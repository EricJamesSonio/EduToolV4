import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';

import { DatabaseService } from '@/core/database/database.provider';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformOwnerGuard, DatabaseService],
})
export class PlatformModule {}