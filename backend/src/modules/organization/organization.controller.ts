import {
  Controller, Post, Get, Patch,
  Body, UseGuards, NotFoundException,
} from '@nestjs/common'
import { OrganizationService } from './organization.service'
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  SeedOrganizationDto,
} from './dto/organization.dto'
import { AuthGuard }    from '@/commons/guards/auth.guard'
import { RolesGuard }   from '@/commons/guards/role.guard'
import { Roles }        from '@/commons/decorators/roles.decorator'
import { CurrentUser }  from '@/commons/decorators/current-user.decorator'

@Controller('organization')
@UseGuards(AuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgService.create(adminId, dto)
  }

  @Get()
  @Roles('admin')
  async getOwn(@CurrentUser('org_id') orgId: string | null) { // <-- changed here
    const org = await this.orgService.getOwn(orgId)
    if (!org) throw new NotFoundException('Organization not found.')
    return org
  }

  @Patch()
  @Roles('admin')
  async update(
    @CurrentUser('org_id') orgId: string, // <-- changed here
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(orgId, dto)
  }

  @Post('seed')
  @Roles('admin')
  async seed(
    @CurrentUser('org_id') orgId: string, // <-- changed here
    @Body() dto: SeedOrganizationDto,
  ) {
    return this.orgService.seed(orgId, dto)
  }
}