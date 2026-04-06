import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { OrgSeederModule } from '../org-seeder/org-seeder.module';

@Module({
  imports: [OrgSeederModule],                              // ✅ here
  controllers: [OrganizationController],                   // ✅ only controllers here
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}