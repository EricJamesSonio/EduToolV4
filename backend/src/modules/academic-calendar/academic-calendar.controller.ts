// src/modules/academic-calendar/academic-calendar.controller.ts
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
import { AcademicCalendarService } from './academic-calendar.service';
import {
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  QueryCalendarEventDto,
} from './dto/academic-calendar.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('academic-calendar')
@UseGuards(AuthGuard, RolesGuard)
export class AcademicCalendarController {
  constructor(private readonly calendarService: AcademicCalendarService) {}

  /**
   * POST /academic-calendar  @Roles(ADMIN)
   * Creates a calendar event. Returns a warning flag if the date is retroactive.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.create(orgId, dto);
  }

  /**
   * GET /academic-calendar?schoolYearId=
   * Returns all calendar events for the org.
   * Optionally filtered by school year.
   * All authenticated roles can view.
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryCalendarEventDto,
  ) {
    return this.calendarService.findAll(orgId, query);
  }

  /**
   * PATCH /academic-calendar/:id  @Roles(ADMIN)
   * Updates a calendar event. Re-checks retroactive warning.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.update(id, orgId, dto);
  }

  /**
   * DELETE /academic-calendar/:id  @Roles(ADMIN)
   * Hard deletes the calendar event.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.calendarService.remove(id, orgId);
  }
}