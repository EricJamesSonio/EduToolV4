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
import { SchoolYearCreateResult } from './dto/school-year.dto'

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
  @CurrentUser('org_id') org_id: string,
  @CurrentUser('id') actorId: string,
  @Body() dto: CreateSchoolYearDto,
): Promise<SchoolYearCreateResult> {
  return this.schoolYearService.create(org_id, dto, actorId)
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
}