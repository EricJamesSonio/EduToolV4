import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LevelService } from './level.service';
import {
  UpdateLevelDto,
  QueryLevelDto,
  CreateLevelDto,
  BulkGenerateLevelsDto,
} from './dto/level.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('levels')
@UseGuards(AuthGuard, RolesGuard)
export class LevelController {
  constructor(private readonly levelService: LevelService) { }

  @Post('add-next')
  @Roles('admin')
  async addNextLevel(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: { programId: string; schoolYearId: string },
  ) {
    return this.levelService.addNextLevel(orgId, dto.programId, dto.schoolYearId);
  }

  @Post('bulk-generate')
  @Roles('admin')
  async bulkGenerate(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: BulkGenerateLevelsDto,
  ) {
    return this.levelService.bulkGenerate(orgId, dto);
  }

  @Get()
  async getLevels(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryLevelDto,
  ) {
    // Filter by course if courseId is provided
    if (query.courseId && query.schoolYearId) {
      return this.levelService.getByCourse(orgId, query.schoolYearId, query.courseId);
    }

    // Filter by strand if strandId is provided
    if (query.strandId && query.schoolYearId) {
      return this.levelService.getByStrand(orgId, query.schoolYearId, query.strandId);
    }

    // Otherwise, return all levels for school year (or all if no school year)
    if (query.schoolYearId) {
      return this.levelService.getBySchoolYear(orgId, query.schoolYearId);
    }

    return this.levelService.getAll(orgId);
  }

  @Post()
  @Roles('admin')
  async createOne(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateLevelDto,
  ) {
    return this.levelService.createOne(orgId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  async updateOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    return this.levelService.updateOne(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.levelService.deleteOne(id, orgId);
    return null;
  }
}