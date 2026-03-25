// @/modules/school-year/school-year.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchoolYearService } from './school-year.service';
import { CreateSchoolYearDto, UpdateSchoolYearDto } from './dto/school-year.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('school-years')
@UseGuards(AuthGuard, RolesGuard)
export class SchoolYearController {
  constructor(private readonly schoolYearService: SchoolYearService) {}

  /**
   * POST /school-years  @Roles(ADMIN)
   * Creates a new school year with status = pending.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSchoolYearDto,
  ) {
    return this.schoolYearService.create(orgId, dto);
  }

  /**
   * GET /school-years
   * Returns all school years for the org — all roles can view.
   */
  @Get()
  async findAll(@CurrentUser('orgId') orgId: string) {
    return this.schoolYearService.findAll(orgId);
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
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.schoolYearService.activate(id, orgId);
  }

  /**
   * PATCH /school-years/:id/end  @Roles(ADMIN)
   * Ends the active school year — permanently archives it.
   */
  @Patch(':id/end')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async end(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.schoolYearService.end(id, orgId);
  }

  /**
   * PATCH /school-years/:id  @Roles(ADMIN)
   * Updates the school year name. Cannot update ended years.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateSchoolYearDto,
  ) {
    return this.schoolYearService.update(id, orgId, dto);
  }
}