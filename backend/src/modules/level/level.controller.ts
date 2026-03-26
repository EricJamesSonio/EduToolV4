// @/modules/level/level.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LevelService } from './level.service';
import {
  UpdateLevelDefaultsDto,
  UpdateLevelDto,
  QueryLevelDto,
} from './dto/level.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('levels')
@UseGuards(AuthGuard, RolesGuard)
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  /**
   * GET /levels/defaults
   * Returns the org's default level template.
   * All authenticated roles can view — Admin manages, others may reference.
   */
  @Get('defaults')
  async getDefaults(@CurrentUser('orgId') orgId: string) {
    return this.levelService.getDefaults(orgId);
  }

  /**
   * PATCH /levels/defaults  @Roles(ADMIN)
   * Admin updates the default level structure for the org.
   * Sends the full desired list; service upserts.
   */
  @Patch('defaults')
  @Roles('admin')
  async updateDefaults(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDefaultsDto,
  ) {
    return this.levelService.updateDefaults(orgId, dto);
  }

  /**
   * GET /levels?schoolYearId=
   * Returns levels scoped to a school year within the org.
   */
  @Get()
  async getBySchoolYear(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryLevelDto,
  ) {
    if (!query.schoolYearId) {
  throw new Error('schoolYearId is required');
}

return this.levelService.getBySchoolYear(orgId, query.schoolYearId);
  }

  /**
   * PATCH /levels/:id  @Roles(ADMIN)
   * Update a single level entry (name only in Phase 2).
   */
  @Patch(':id')
  @Roles('admin')
  async updateOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    return this.levelService.updateOne(id, orgId, dto);
  }
}