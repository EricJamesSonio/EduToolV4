// @/modules/organization/organization.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards, NotFoundException
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('organization')
@UseGuards(AuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  /**
   * POST /organization  @Roles(ADMIN)
   * Admin creates their organization on first login setup.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgService.create(adminId, dto);
  }

  /**
   * GET /organization  @Roles(ADMIN)
   * Returns the admin's own organization.
   */
  @Get()
  @Roles('admin')
  async getOwn(@CurrentUser('orgId') orgId: string | null) {
    const org = await this.orgService.getOwn(orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    return org;
  }

  /**
   * PATCH /organization  @Roles(ADMIN)
   * Update org name or description.
   */
  @Patch()
  @Roles('admin')
  async update(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(orgId, dto);
  }
}