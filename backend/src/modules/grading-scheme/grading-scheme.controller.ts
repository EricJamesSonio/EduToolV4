// filepath: src/modules/grading-scheme/grading-scheme.controller.ts

import {
  Controller, Get, Post, Patch, Body,
  Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GradingSchemeService } from './grading-scheme.service';
import {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  ApplyTemplateToClassDto,
  ApplyTemplateToProgramDto,
} from './dto/grading-scheme.dto';
import { AuthGuard }   from '@/commons/guards/auth.guard';
import { RolesGuard }  from '@/commons/guards/role.guard';
import { Roles }       from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('grading-schemes')
@UseGuards(AuthGuard, RolesGuard)
export class GradingSchemeController {
  constructor(private readonly service: GradingSchemeService) {}

  // educator: get scheme for their class
  @Get('class/:classId')
  @Roles('admin', 'educator')
  async findByClass(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findByClass(classId, orgId);
  }

  // educator: get allowed assessment types based on scheme
  @Get('class/:classId/allowed-types')
  @Roles('admin', 'educator')
  async getAllowedTypes(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.getAllowedAssessmentTypes(classId, orgId);
  }

  // educator: manually create scheme for a class
  @Post()
  @Roles('admin', 'educator')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradingSchemeDto,
  ) {
    return this.service.create(orgId, dto);
  }

  // educator/admin: update existing scheme
  @Patch(':id')
  @Roles('admin', 'educator')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateGradingSchemeDto,
  ) {
    return this.service.update(id, orgId, dto);
  }

  // admin: apply a template to a single class
  @Post('apply-to-class')
  @Roles('admin')
  async applyToClass(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: ApplyTemplateToClassDto,
  ) {
    return this.service.applyTemplateToClass(orgId, dto);
  }

  // admin: bulk apply a template to all classes under a program
  @Post('apply-to-program')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async applyToProgram(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: ApplyTemplateToProgramDto,
  ) {
    return this.service.applyTemplateToProgram(orgId, dto);
  }
}