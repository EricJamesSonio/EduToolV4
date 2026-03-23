// src/modules/section/section.controller.ts
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
import { SectionService } from './section.service';
import { CreateSectionDto, UpdateSectionDto, QuerySectionDto } from './dto/section.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('sections')
@UseGuards(AuthGuard, RolesGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  /**
   * POST /sections  @Roles(ADMIN)
   * Admin creates a named section under a level with a capacity limit.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionService.create(orgId, dto);
  }

  /**
   * GET /sections
   * Returns all sections in the org. Optionally filtered by levelId.
   * All authenticated roles can view sections.
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QuerySectionDto,
  ) {
    return this.sectionService.findAll(orgId, query);
  }

  /**
   * PATCH /sections/:id  @Roles(ADMIN)
   * Admin updates a section's name or capacity.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionService.update(id, orgId, dto);
  }

  /**
   * DELETE /sections/:id  @Roles(ADMIN)
   * Soft deletes a section. Blocked if students are assigned.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.sectionService.remove(id, orgId);
  }
}