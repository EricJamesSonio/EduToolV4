// backend/src/modules/academic-calendar/program-calendar/program-calendar.controller.ts

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
import { ProgramCalendarService } from './program-calendar.service';
import {
  CreateProgramCalendarDto,
  UpdateProgramCalendarDto,
  QueryProgramCalendarDto,
  SaveHolidayConfigDto,
} from '../dto/program-calendar.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('program-calendars')
@UseGuards(AuthGuard, RolesGuard)
export class ProgramCalendarController {
  constructor(private readonly service: ProgramCalendarService) {}

  // ── STATIC ROUTES FIRST — must come before /:id ───────────────────────────

  /**
   * GET /program-calendars/holidays
   * Returns the org's global holiday config (enabled/disabled list + custom).
   * schoolYearId param accepted but config is org-global.
   */
  @Get('holidays')
  async getHolidayConfig(@CurrentUser('org_id') orgId: string) {
    return this.service.getHolidayConfig(orgId);
  }

  /**
   * POST /program-calendars/holidays
   * Save the org's global holiday config.
   * Automatically re-syncs ProgramCalendarHoliday rows for ALL existing
   * program calendars in this org.
   */
  @Post('holidays')
  @Roles('admin')
  async saveHolidayConfig(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: SaveHolidayConfigDto,
  ) {
    return this.service.saveHolidayConfig(orgId, dto);
  }

  /**
   * POST /program-calendars/holidays/seed
   * Seed default Philippine holidays into the org-global config.
   * Smart: only adds holidays not already enabled — skips existing.
   */
  @Post('holidays/seed')
  @Roles('admin')
  async seedDefaultHolidays(@CurrentUser('org_id') orgId: string) {
    return this.service.seedDefaultHolidays(orgId);
  }

  /**
   * GET /program-calendars/by-program?programId=&schoolYearId=
   */
  @Get('by-program')
  async findByProgram(
    @CurrentUser('org_id') orgId: string,
    @Query('programId') programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.findByProgram(programId, schoolYearId, orgId);
  }

  /**
   * GET /program-calendars/for-program/:programId?schoolYearId=
   * Returns calendar info + breaks for semester-template assignment, or null if none.
   */
  @Get('for-program/:programId')
  async getForProgram(
    @CurrentUser('org_id') orgId: string,
    @Param('programId') programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.getCalendarForProgram(programId, schoolYearId, orgId);
  }

  /**
   * GET /program-calendars/terms?programId=&schoolYearId=
   * Returns computed terms — consumed by Semester Template module.
   */
  @Get('terms')
  async getTerms(
    @CurrentUser('org_id') orgId: string,
    @Query('programId') programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.getTermsForProgram(programId, schoolYearId, orgId);
  }

  // ── Collection ────────────────────────────────────────────────────────────

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProgramCalendarDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryProgramCalendarDto,
  ) {
    return this.service.findAll(orgId, query);
  }

  // ── /:id routes LAST ──────────────────────────────────────────────────────

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.service.findById(id, orgId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProgramCalendarDto,
  ) {
    return this.service.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    await this.service.delete(id, orgId);
  }
}
