import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LevelService } from './level.service';
import { UpdateLevelDefaultsDto, UpdateLevelDto, QueryLevelDto, CreateLevelDto } from './dto/level.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('levels')
@UseGuards(AuthGuard, RolesGuard)
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('defaults')
  async getDefaults(@CurrentUser('orgId') orgId: string) {
    const data = await this.levelService.getDefaults(orgId);
    return { success: true, data };
  }

  @Patch('defaults')
  @Roles('admin')
  async updateDefaults(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDefaultsDto,
  ) {
    const data = await this.levelService.updateDefaults(orgId, dto);
    return { success: true, data };
  }

  @Get()
  async getLevels(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryLevelDto,
  ) {
    const data = query.schoolYearId
      ? await this.levelService.getBySchoolYear(orgId, query.schoolYearId)
      : await this.levelService.getAll(orgId);
    return { success: true, data };
  }

  @Post()
  @Roles('admin')
  async createOne(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateLevelDto,
  ) {
    const data = await this.levelService.createOne(orgId, dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('admin')
  async updateOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    const data = await this.levelService.updateOne(id, orgId, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('admin')
  async deleteOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.levelService.deleteOne(id, orgId);
    return { success: true, data: null };
  }
}