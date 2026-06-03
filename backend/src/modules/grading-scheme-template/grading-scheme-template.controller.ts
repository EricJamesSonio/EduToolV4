// filepath: src/modules/grading-scheme-template/grading-scheme-template.controller.ts

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GradingSchemeTemplateService } from './grading-scheme-template.service';
import {
  CreateGradingSchemeTemplateDto,
  UpdateGradingSchemeTemplateDto,ApplyTemplateToClassDto, ApplyTemplateToProgramDto
} from './dto/grading-scheme-template.dto';
import { AuthGuard }   from '@/commons/guards/auth.guard';
import { RolesGuard }  from '@/commons/guards/role.guard';
import { Roles }       from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('grading-scheme-templates')
@UseGuards(AuthGuard, RolesGuard)
export class GradingSchemeTemplateController {
  constructor(private readonly service: GradingSchemeTemplateService) {}

  @Get()
  @Roles('admin', 'educator')
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query('programType') programType?: string,
  ) {
    return this.service.findAll(orgId, programType);
  }

  @Get(':id')
  @Roles('admin', 'educator')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findById(id, orgId);
  }

  @Post()
  @Roles('admin', 'educator')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradingSchemeTemplateDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'educator')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateGradingSchemeTemplateDto,
  ) {
    return this.service.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin', 'educator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.delete(id, orgId);
  }

@Post('apply/class')
@Roles('admin')
async applyToClass(
  @CurrentUser('org_id') orgId: string,
  @Body() dto: ApplyTemplateToClassDto,
) {
  return this.service.applyToClass(orgId, dto);
}

@Post('apply/program')
@Roles('admin')
async applyToProgram(
  @CurrentUser('org_id') orgId: string,
  @Body() dto: ApplyTemplateToProgramDto,
) {
  return this.service.applyToProgram(orgId, dto);
}
}