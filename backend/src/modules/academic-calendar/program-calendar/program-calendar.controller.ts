// backend/src/modules/academic-calendar/program-calendar.controller.ts

import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProgramCalendarService }    from './program-calendar.service';
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

  // ── Program Calendars ────────────────────────────────────────────────────

  /**
   * POST /program-calendars
   * Create a program-scoped academic calendar.
   * Breaks are validated, sorted, and terms are auto-computed + stored.
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
   * GET /program-calendars/by-program?programId=&schoolYearId=
   * Convenience endpoint — finds the calendar for a specific program+year.
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
   * PATCH /program-calendars/:id
   * Update dates or breaks (full replacement of breaks triggers term recompute).
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

  // ── Holiday Config ────────────────────────────────────────────────────────

  /**
   * GET /program-calendars/holidays?schoolYearId=
   * Returns the full holiday list with enabled/disabled status.
   * If no config saved yet, defaults (isDefault=true) are returned.
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
   * Seeds all enabled holidays into AcademicCalendar events table
   * for the given school year and year number.
   * Idempotent — skips already-seeded holidays.
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

  /**
   * GET /program-calendars/terms?programId=&schoolYearId=
   * Returns computed terms for a program — used by Semester Template module.
   */
  @Get('terms')
  async getTerms(
    @CurrentUser('org_id') orgId: string,
    @Query('programId')    programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.getTermsForProgram(programId, schoolYearId, orgId);
  }
}