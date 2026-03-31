import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LevelService } from './level.service';
import { UpdateLevelDefaultsDto, UpdateLevelDto, QueryLevelDto, CreateLevelDto } from './dto/level.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

// backend/src/modules/level/level.controller.ts

@Controller('levels')
@UseGuards(AuthGuard, RolesGuard)
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('defaults')
  async getDefaults(@CurrentUser('orgId') orgId: string) {
    return this.levelService.getDefaults(orgId); // interceptor wraps this
  }

  @Patch('defaults')
  @Roles('admin')
  async updateDefaults(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDefaultsDto,
  ) {
    return this.levelService.updateDefaults(orgId, dto);
  }

  @Get()
  async getLevels(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryLevelDto,
  ) {
    if (query.schoolYearId) {
      return this.levelService.getBySchoolYear(orgId, query.schoolYearId);
    }
    return this.levelService.getAll(orgId);
  }

  @Post()
  @Roles('admin')
  async createOne(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateLevelDto,
  ) {
    return this.levelService.createOne(orgId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  async updateOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    return this.levelService.updateOne(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.levelService.deleteOne(id, orgId);
    return null; // interceptor wraps to { success: true, data: null }
  }
}