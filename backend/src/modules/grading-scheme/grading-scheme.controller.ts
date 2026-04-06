import {
  Controller, Post, Get, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { GradingSchemeService } from './grading-scheme.service';
import {
  CreateGradingSchemeDto, UpdateGradingSchemeDto, UpdateDefaultGradingSchemeDto,
} from './dto/grading-scheme.dto';
import { AuthGuard }    from '@/commons/guards/auth.guard';
import { RolesGuard }   from '@/commons/guards/role.guard';
import { Roles }        from '@/commons/decorators/roles.decorator';
import { CurrentUser }  from '@/commons/decorators/current-user.decorator';
import { IsUUID }       from 'class-validator';

class SchoolYearQueryDto {
  @IsUUID()
  schoolYearId: string
}

@Controller('grading-schemes')
@UseGuards(AuthGuard, RolesGuard)
export class GradingSchemeController {
  constructor(private readonly gradingSchemeService: GradingSchemeService) {}

  @Get('default')
  async getDefault(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SchoolYearQueryDto,
  ) {
    return this.gradingSchemeService.getDefault(orgId, query.schoolYearId);
  }

  @Patch('default')
  @Roles('admin')
  async updateDefault(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SchoolYearQueryDto,
    @Body() dto: UpdateDefaultGradingSchemeDto,
  ) {
    return this.gradingSchemeService.updateDefault(orgId, query.schoolYearId, dto);
  }

  @Get('class/:classId')
  @Roles('educator')
  async getForClass(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.gradingSchemeService.findForClass(classId, orgId);
  }

  @Patch('class/:classId')
  @Roles('educator')
  async saveForClass(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @Query() query: SchoolYearQueryDto,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateGradingSchemeDto,
  ) {
    return this.gradingSchemeService.saveForClass(
      classId, orgId, query.schoolYearId, educatorId, dto,
    );
  }

  @Post()
  @Roles('educator')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SchoolYearQueryDto,
    @CurrentUser('id') educatorId: string,
    @Body() dto: CreateGradingSchemeDto,
  ) {
    return this.gradingSchemeService.create(orgId, query.schoolYearId, educatorId, dto);
  }

  @Get()
  @Roles('educator')
  async findByEducator(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SchoolYearQueryDto,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.gradingSchemeService.findByEducator(orgId, query.schoolYearId, educatorId);
  }

  @Patch(':id')
  @Roles('educator')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateGradingSchemeDto,
  ) {
    return this.gradingSchemeService.update(id, orgId, educatorId, dto);
  }
}