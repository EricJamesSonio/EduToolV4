// src/domains/platform/platform-domain.module.ts
import { Module } from '@nestjs/common';

import { OrganizationModule } from '@/modules/organization/organization.module';
import { PlatformModule } from '@/modules/platform/platform.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [OrganizationModule, PlatformModule, AuthModule],
  exports: [OrganizationModule, PlatformModule, AuthModule],
})
export class PlatformDomainModule {}