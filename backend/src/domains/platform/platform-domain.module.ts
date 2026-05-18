// src/domains/platform/platform-domain.module.ts
import { Module } from '@nestjs/common';

import { OrganizationModule } from '@/modules/organization/organization.module';
import { PlatformModule } from '@/modules/platform/platform.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { GuideModule } from '@/modules/guide/guide.module';

@Module({
  imports: [OrganizationModule, PlatformModule, AuthModule, GuideModule],
  exports: [OrganizationModule, PlatformModule, AuthModule, GuideModule],
})
export class PlatformDomainModule {}