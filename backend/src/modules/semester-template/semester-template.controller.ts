// filepath: backend/src/modules/semester-template/semester-template.controller.ts

import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { SemesterTemplateService } from './semester-template.service'
import {
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignTemplateDto,
} from './dto/semester-template.dto'
import { AuthGuard }   from '@/commons/guards/auth.guard'
import { RolesGuard }  from '@/commons/guards/role.guard'
import { Roles }       from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

@Controller('semester-templates')
@UseGuards(AuthGuard, RolesGuard)
export class SemesterTemplateController {
  constructor(private readonly service: SemesterTemplateService) {}

  // Templates CRUD — scoped by programType query param
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateSemesterTemplateDto,
  ) {
    return this.service.create(orgId, dto)
  }

@Get()
@Roles('admin')
async findAll(
  @CurrentUser('org_id') orgId: string,
  @Query('schoolYearId') schoolYearId: string,
) {
  return this.service.findAllBySchoolYear(orgId, schoolYearId)
}

  @Get(':id')
  @Roles('admin')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findById(id, orgId)
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateSemesterTemplateDto,
  ) {
    return this.service.update(id, orgId, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.remove(id, orgId)
  }

  // Assignments — per school year view
  @Get('assignments/by-school-year')
  @Roles('admin')
  async findAssignments(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.service.findAssignmentsBySchoolYear(orgId, schoolYearId)
  }

  @Post('assignments')
  @Roles('admin')
  async assign(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: AssignTemplateDto,
  ) {
    return this.service.assignToProgram(orgId, dto)
  }

  @Delete('assignments/:programId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAssignment(
    @Param('programId') programId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.removeAssignment(programId, orgId)
  }
}