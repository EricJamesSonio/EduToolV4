// src/modules/concern/student/concern-student.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConcernStudentService } from './concern-student.service';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import {
  CreateConcernDto,
  ReplyConcernDto,
  QueryConcernDto,
} from '../dto/concern.dto';

@Controller('concerns')
@UseGuards(AuthGuard, RolesGuard)
export class ConcernStudentController {
  constructor(private readonly service: ConcernStudentService) {}

  // GET /concerns/categories — any authenticated user in the org can read
  @Get('categories')
  getCategories(@CurrentUser('org_id') orgId: string) {
    return this.service.getCategories(orgId);
  }

  // POST /concerns — student submits a new concern
  // TODO: consider rate-limiting concern creation per account if abuse is observed
  @Post()
  @Roles('student')
  create(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('fullName') fullName: string,
    @Body() dto: CreateConcernDto,
  ) {
    return this.service.submit({ orgId, accountId, role, fullName }, dto);
  }

  // GET /concerns/mine — caller's own concerns
  @Get('mine')
  @Roles('student')
  listMine(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryConcernDto,
  ) {
    return this.service.listMine(orgId, accountId, query);
  }

  // GET /concerns/:id — full concern + messages (ownership-checked)
  @Get(':id')
  @Roles('student')
  getOne(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
    @Param('id') concernId: string,
  ) {
    return this.service.getOne(orgId, concernId, accountId);
  }

  // POST /concerns/:id/reply — reply to own concern
  @Post(':id/reply')
  @Roles('student')
  reply(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('fullName') fullName: string,
    @Param('id') concernId: string,
    @Body() dto: ReplyConcernDto,
  ) {
    return this.service.reply({ orgId, accountId, role, fullName, concernId }, dto);
  }
}