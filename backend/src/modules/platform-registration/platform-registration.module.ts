import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/core/database/database.module';
import { PlatformRegistrationController } from './platform-registration.controller';
import { PlatformRegistrationService } from './platform-registration.service';
import { PlatformRegistrationRepository } from './platform-registration.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [PlatformRegistrationController],
  providers: [PlatformRegistrationService, PlatformRegistrationRepository],
  exports: [PlatformRegistrationService],
})
export class PlatformRegistrationModule {}
