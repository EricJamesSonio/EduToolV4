// @/modules/educator/educator.controller.ts
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
import { EducatorService } from './educator.service';
import {
  CreateEducatorDto,
  UpdateEducatorDto,
  QueryEducatorDto,
} from './dto/educator.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('educators')
@UseGuards(AuthGuard, RolesGuard)
export class EducatorController {
  constructor(private readonly educatorService: EducatorService) {}

  /**
   * POST /educators  @Roles(ADMIN)
   * Admin creates an educator account.
   * Returns plain password once for distribution.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateEducatorDto,
  ) {
    return this.educatorService.create(orgId, dto);
  }

  /**
   * GET /educators
   * Returns all educators in the org. Supports ?search= by name or ID.
   * All authenticated roles can view.
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryEducatorDto,
  ) {
    return this.educatorService.findAll(orgId, query);
  }

  /**
   * GET /educators/:id
   * Returns a single educator's profile.
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorService.findById(id, orgId);
  }

  /**
   * PATCH /educators/:id  @Roles(ADMIN)
   * Admin updates educator name or email.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateEducatorDto,
  ) {
    return this.educatorService.update(id, orgId, dto);
  }

  /**
   * DELETE /educators/:id  @Roles(ADMIN)
   * Soft deletes the educator.
   * Phase 3: blocked if active classes exist.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.educatorService.remove(id, orgId);
  }

  /**
   * POST /educators/:id/reset-password  @Roles(ADMIN)
   * Generates a new system password. Returns it plain once for Admin to distribute.
   * Previous password is immediately invalidated.
   */
  @Post(':id/reset-password')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorService.resetPassword(id, orgId);
  }
}