// src/domains/platform/platform-domain.module.ts
import { Module } from '@nestjs/common';

import { OrganizationModule } from '@/modules/organization/organization.module';
import { PlatformModule } from '@/modules/platform/platform.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PlatformRegistrationModule } from '@/modules/platform-registration/platform-registration.module';

@Module({
  imports: [
    OrganizationModule,
    PlatformModule,
    AuthModule,
    PlatformRegistrationModule,
  ],
  exports: [
    OrganizationModule,
    PlatformModule,
    AuthModule,
    PlatformRegistrationModule,
  ],
})
export class PlatformDomainModule {}
