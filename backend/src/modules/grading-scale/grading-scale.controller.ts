// backend/src/modules/grading-scale/grading-scale.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
  AssignGradingScaleDto,
} from './dto/grading-scale.dto';
import { AuthGuard }   from '@/commons/guards/auth.guard';
import { RolesGuard }  from '@/commons/guards/role.guard';
import { Roles }       from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('grading-scales')
@UseGuards(AuthGuard, RolesGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  // ── STATIC / SPECIFIC ROUTES FIRST ───────────────────────────────────────
  // NestJS matches top-to-bottom. Static string segments must come before
  // :param segments, otherwise "programs" or "by-class" get swallowed as IDs.

  /**
   * GET /grading-scales/by-class/:classId
   * Returns the grading scale applied to the class's program.
   * Accessible to educators and admins.
   */
  @Get('by-class/:classId')
  async findByClass(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const scale = await this.gradingScaleService.findByClassId(classId, orgId);
    if (!scale) {
      throw new NotFoundException(
        "No grading scale configured for this class's program.",
      );
    }
    return scale;
  }

  /**
   * POST /grading-scales/programs/:programId/grading-scale
   * Assign an existing grading scale to a program.
   */
  @Post('programs/:programId/grading-scale')
  @Roles('admin')
  async assignToProgram(
    @Param('programId') programId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: AssignGradingScaleDto,
  ) {
    return this.gradingScaleService.assignToProgram(
      orgId,
      programId,
      dto.scaleId,
    );
  }

  // ── COLLECTION ROUTES ─────────────────────────────────────────────────────

  /**
   * POST /grading-scales
   * Create a new grading scale for a program & school year.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradingScaleDto,
  ) {
    return this.gradingScaleService.create(orgId, dto);
  }

  /**
   * GET /grading-scales
   * Get all grading scales (optionally filtered by programId, schoolYearId).
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryGradingScaleDto,
  ) {
    return this.gradingScaleService.findAll(orgId, query);
  }

  // ── :id ROUTES LAST ───────────────────────────────────────────────────────

  /**
   * PATCH /grading-scales/:id
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateGradingScaleDto,
  ) {
    return this.gradingScaleService.update(id, orgId, dto);
  }

  /**
   * DELETE /grading-scales/:id
   */
  @Delete(':id')
  @Roles('admin')
  async delete(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.gradingScaleService.delete(id, orgId);
  }
}