import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { OrgSeederModule } from '../org-seeder/org-seeder.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [OrgSeederModule, AuditLogModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService],
})
export class OrganizationModule {}
