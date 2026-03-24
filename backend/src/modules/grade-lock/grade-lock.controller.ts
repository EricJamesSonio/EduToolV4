// src/modules/grade-lock/grade-lock.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';

import { GradeLockService } from './grade-lock.service';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

import {
  CreateGradeLockSettingDto,
  QueryGradeLockDto,
} from './dto/grade-lock.dto';

@Controller('grade-lock')
@UseGuards(AuthGuard, RolesGuard)
export class GradeLockController {
  constructor(private readonly service: GradeLockService) {}

  // ───────────────── SETTINGS ─────────────────

  @Post('settings')
  @Roles('admin')
  createSetting(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateGradeLockSettingDto,
  ) {
    return this.service.createSetting(orgId, dto);
  }

  @Get('settings')
  getSetting(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryGradeLockDto,
  ) {
    return this.service.getSetting(orgId, query.schoolYearId);
  }

  // ───────────────── LOCKING ─────────────────

  @Post(':classId/lock')
  @Roles('educator')
  lockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.lockClass(classId, user);
  }

  @Post(':classId/unlock')
  @Roles('admin')
  unlockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.unlockClass(classId, user);
  }

  // ───────────────── VIEW ─────────────────

  @Get('classes')
  @Roles('admin')
  getClassLocks(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryGradeLockDto,
  ) {
    return this.service.getClassLocks(orgId, query);
  }
}