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
}