// @/modules/registrar/registrar.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrarService } from './registrar.service';
import {
  CreateRegistrarDto,
  QueryRegistrarDto,
  UpdateRegistrarStatusDto,
} from './dto/registrar.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('registrars')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class RegistrarController {
  constructor(private readonly registrarService: RegistrarService) {}

  /**
   * POST /registrars  @Roles(ADMIN)
   * Admin creates a registrar account (username + full name, org-based email generated).
   * Returns plain password once for distribution.
   */
  @Post()
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateRegistrarDto,
  ) {
    return this.registrarService.create(orgId, dto);
  }

  /**
   * GET /registrars
   * Returns all registrar accounts in the org. Supports ?search= by username or email.
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryRegistrarDto,
  ) {
    return this.registrarService.findAll(orgId, query);
  }

  /**
   * PATCH /registrars/:id/status  @Roles(ADMIN)
   * Suspend or reactivate a registrar account.
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateRegistrarStatusDto,
  ) {
    return this.registrarService.updateStatus(id, orgId, dto);
  }

  /**
   * DELETE /registrars/:id  @Roles(ADMIN)
   * Soft deletes the registrar account.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.registrarService.remove(id, orgId);
  }

  /**
   * POST /registrars/:id/reset-password  @Roles(ADMIN)
   * Generates a new system password. Returns it once for Admin to distribute.
   */
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.registrarService.resetPassword(id, orgId);
  }
}