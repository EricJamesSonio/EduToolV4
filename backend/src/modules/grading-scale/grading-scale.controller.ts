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
} from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
  AssignGradingScaleDto,
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
   * Create a new grading scale for a program & school year
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradingScaleDto,
  ) {
    return this.gradingScaleService.create(orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.gradingScaleService.delete(id, orgId);
  }

  /**
   * Get all grading scales (optionally filtered by programId, schoolYearId)
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryGradingScaleDto,
  ) {
    return this.gradingScaleService.findAll(orgId, query);
  }

  /**
   * Update a grading scale by ID
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
   * Assign an existing grading scale to a program
   * POST /programs/:programId/grading-scale
   * Body: { scaleId: string }
   *
   * This will:
   * - Find the scale by scaleId and orgId
   * - Unassign any existing scale for this program (if one exists)
   * - Assign the new scale to the program
   */
  @Post('/programs/:programId/grading-scale')
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
}