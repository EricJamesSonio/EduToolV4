import { Controller, Get } from '@nestjs/common';
import { OrganizationService } from '@/modules/organization/organization.service';

@Controller('public')
export class PublicController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('organizations')
  async getOrganizations() {
    return this.orgService.getAllOrganizations();
  }
}
