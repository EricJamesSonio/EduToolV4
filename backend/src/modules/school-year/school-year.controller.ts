// @/modules/school-year/school-year.controller.ts
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
import { SchoolYearService } from './school-year.service';
import { SchoolYearReadinessService } from './school-year-readiness.service';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
} from './dto/school-year.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { SchoolYearCreateResult } from './dto/school-year.dto';

@Controller('school-years')
@UseGuards(AuthGuard, RolesGuard)
export class SchoolYearController {
  constructor(
    private readonly schoolYearService: SchoolYearService,
    private readonly readinessService: SchoolYearReadinessService,
  ) {}

  /**
   * POST /school-years  @Roles(ADMIN)
   * Creates a new school year with status = pending.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') org_id: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateSchoolYearDto,
  ): Promise<SchoolYearCreateResult> {
    return this.schoolYearService.create(org_id, dto, actorId);
  }
  /**
   * GET /school-years
   * Returns all school years for the org — all roles can view.
   */
  @Get()
  async findAll(@CurrentUser('org_id') orgId: string) {
    return this.schoolYearService.findAll(orgId);
  }

  /**
   * GET /school-years/readiness
   * Lightweight per-year readiness summaries for the org — all roles can view.
   */
  @Get('readiness')
  async getReadinessSummaries(@CurrentUser('org_id') orgId: string) {
    return this.readinessService.summarizeAll(orgId);
  }

  /**
   * GET /school-years/:id/readiness
   * Full readiness detail (blocking + warnings) for a single school year.
   */
  @Get(':id/readiness')
  async getReadiness(
    @CurrentUser('org_id') orgId: string,
    @Param('id') id: string,
  ) {
    return this.readinessService.detail(orgId, id);
  }

  /**
   * PATCH /school-years/:id/activate  @Roles(ADMIN)
   * Transitions a pending school year to active.
   * Only one active year allowed at a time.
   */
  @Patch(':id/activate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schoolYearService.activate(id, orgId, actorId);
  }

  @Patch(':id/end')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async end(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schoolYearService.end(id, orgId, actorId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateSchoolYearDto,
  ) {
    return this.schoolYearService.update(id, orgId, dto, actorId);
  }

  /**
   * DELETE /school-years/:id  @Roles(ADMIN)
   * Permanently deletes a school year only if it is pending and unused
   * (no students, classes, sections, or curriculum data attached).
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schoolYearService.remove(id, orgId, actorId);
  }
}
