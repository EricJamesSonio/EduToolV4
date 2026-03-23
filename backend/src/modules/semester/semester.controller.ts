// src/modules/semester/semester.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SemesterService } from './semester.service';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('semester-settings')
@UseGuards(AuthGuard, RolesGuard)
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  /**
   * POST /semester-settings  @Roles(ADMIN)
   * Creates a semester with its terms. Max 3 per school year.
   * Validates non-overlapping date ranges.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSemesterDto,
  ) {
    return this.semesterService.create(orgId, dto);
  }

  /**
   * GET /semester-settings
   * Returns all semesters with their terms for the org.
   * All authenticated roles can view.
   */
  @Get()
  async findAll(@CurrentUser('orgId') orgId: string) {
    return this.semesterService.findAll(orgId);
  }

  /**
   * PATCH /semester-settings/:id  @Roles(ADMIN)
   * Updates a semester name, dates, or terms.
   * Re-validates overlap on every update.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateSemesterDto,
  ) {
    return this.semesterService.update(id, orgId, dto);
  }

  /**
   * DELETE /semester-settings/:id  @Roles(ADMIN)
   * Deletes the semester and all its terms.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.semesterService.remove(id, orgId);
  }
}