// backend/src/modules/academic-calendar/program-calendar.controller.ts

import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProgramCalendarService } from './program-calendar.service';
import {
  CreateProgramCalendarDto,
  UpdateProgramCalendarDto,
  QueryProgramCalendarDto,
  SaveHolidayConfigDto,
  SeedHolidaysToCalendarDto,
} from '../dto/program-calendar.dto';
import { AuthGuard }   from '@/commons/guards/auth.guard';
import { RolesGuard }  from '@/commons/guards/role.guard';
import { Roles }       from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('program-calendars')
@UseGuards(AuthGuard, RolesGuard)
export class ProgramCalendarController {
  constructor(private readonly service: ProgramCalendarService) {}

  // ── IMPORTANT: all static string routes MUST come before /:id ────────────
  // NestJS matches routes top-to-bottom. If /:id comes first, "holidays",
  // "by-program", and "terms" will all be swallowed by it as the id param.

  // ── Holiday Config ────────────────────────────────────────────────────────

  /**
   * GET /program-calendars/holidays?schoolYearId=
   * Returns the full holiday list with enabled/disabled status.
   */
  @Get('holidays')
  async getHolidayConfig(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.getHolidayConfig(orgId, schoolYearId);
  }

  /**
   * POST /program-calendars/holidays
   * Save the admin's holiday enable/disable choices + custom holidays.
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
   * Seeds enabled holidays into AcademicCalendar events. Idempotent.
   */
  @Post('holidays/seed')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async seedHolidays(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: SeedHolidaysToCalendarDto,
  ) {
    return this.service.seedHolidaysToCalendar(orgId, dto);
  }

  // ── Static query routes ───────────────────────────────────────────────────

  /**
   * GET /program-calendars/by-program?programId=&schoolYearId=
   */
  @Get('by-program')
  async findByProgram(
    @CurrentUser('org_id') orgId: string,
    @Query('programId')    programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.findByProgram(programId, schoolYearId, orgId);
  }

  /**
   * GET /program-calendars/terms?programId=&schoolYearId=
   * Returns computed terms — consumed by Semester Template module.
   */
  @Get('terms')
  async getTerms(
    @CurrentUser('org_id') orgId: string,
    @Query('programId')    programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.getTermsForProgram(programId, schoolYearId, orgId);
  }

  // ── Collection ────────────────────────────────────────────────────────────

  /**
   * POST /program-calendars
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProgramCalendarDto,
  ) {
    return this.service.create(orgId, dto);
  }

  /**
   * GET /program-calendars?schoolYearId=&programId=
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryProgramCalendarDto,
  ) {
    return this.service.findAll(orgId, query);
  }

  // ── /:id routes LAST — after all static string routes ────────────────────

  /**
   * GET /program-calendars/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findById(id, orgId);
  }

  /**
   * PATCH /program-calendars/:id
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProgramCalendarDto,
  ) {
    return this.service.update(id, orgId, dto);
  }

  /**
   * DELETE /program-calendars/:id
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.delete(id, orgId);
  }
}