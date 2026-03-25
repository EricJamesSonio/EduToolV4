// @/modules/grading-scale/grading-scale.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
} from './dto/grading-scale.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('grading-scales')
@UseGuards(AuthGuard, RolesGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  /**
   * POST /grading-scales  @Roles(ADMIN)
   * Creates a grading scale for a level + school year.
   * Validates full 0–100 range coverage with no gaps or overlaps.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateGradingScaleDto,
  ) {
    return this.gradingScaleService.create(orgId, dto);
  }

  /**
   * GET /grading-scales
   * Returns all grading scales. Filterable by ?levelId= and ?schoolYearId=
   * All authenticated roles can view.
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryGradingScaleDto,
  ) {
    return this.gradingScaleService.findAll(orgId, query);
  }

  /**
   * PATCH /grading-scales/:id  @Roles(ADMIN)
   * Updates name or ranges. Blocked if scale is locked.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateGradingScaleDto,
  ) {
    return this.gradingScaleService.update(id, orgId, dto);
  }
}