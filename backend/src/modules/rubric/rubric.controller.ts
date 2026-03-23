// src/modules/rubric/rubric.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RubricService } from './rubric.service';
import {
  CreateRubricDto,
  UpdateRubricDto,
  UpdateDefaultRubricDto,
} from './dto/rubric.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('rubrics')
@UseGuards(AuthGuard, RolesGuard)
export class RubricController {
  constructor(private readonly rubricService: RubricService) {}

  /**
   * GET /rubrics/default
   * Returns the org's default rubric.
   * Auto-creates an empty one if none exists.
   * NOTE: defined before :id to avoid route collision.
   */
  @Get('default')
  async getDefault(@CurrentUser('orgId') orgId: string) {
    return this.rubricService.getDefault(orgId);
  }

  /**
   * PATCH /rubrics/default  @Roles(ADMIN)
   * Admin updates the org default rubric.
   * Validates weights sum to 100%.
   */
  @Patch('default')
  @Roles('admin')
  async updateDefault(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateDefaultRubricDto,
  ) {
    return this.rubricService.updateDefault(orgId, dto);
  }

  /**
   * POST /rubrics  @Roles(EDUCATOR)
   * Educator creates a rubric in their personal library.
   */
  @Post()
  @Roles('educator')
  async create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: CreateRubricDto,
  ) {
    return this.rubricService.create(orgId, educatorId, dto);
  }

  /**
   * GET /rubrics  @Roles(EDUCATOR)
   * Returns the educator's personal rubric library.
   */
  @Get()
  @Roles('educator')
  async findByEducator(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.rubricService.findByEducator(orgId, educatorId);
  }

  /**
   * PATCH /rubrics/:id  @Roles(EDUCATOR)
   * Educator updates one of their own rubrics.
   * Blocked if the rubric is locked (class has enrolled students).
   */
  @Patch(':id')
  @Roles('educator')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateRubricDto,
  ) {
    return this.rubricService.update(id, orgId, educatorId, dto);
  }
}