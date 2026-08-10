// src/modules/concern/category/concern-category.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ConcernCategoryService } from './concern-category.service';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/concern.dto';

@Controller('concerns/categories')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ConcernCategoryController {
  constructor(private readonly service: ConcernCategoryService) {}

  // GET /concerns/categories/all — all categories (admin category manager),
  // distinct from the student-facing GET /concerns/categories (active only).
  @Get('all')
  list(@CurrentUser('org_id') orgId: string) {
    return this.service.list(orgId);
  }

  // POST /concerns/categories
  @Post()
  create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.create(orgId, dto);
  }

  // PATCH /concerns/categories/:id
  @Patch(':id')
  update(
    @CurrentUser('org_id') orgId: string,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(orgId, categoryId, dto);
  }
}