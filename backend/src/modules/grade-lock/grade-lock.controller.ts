// @/modules/grade-lock/grade-lock.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';

import { BadRequestException } from '@nestjs/common';
import { GradeLockService } from './grade-lock.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

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
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradeLockSettingDto,
  ) {
    return this.service.createSetting(orgId, dto);
  }

  // grade-lock.controller.ts
  @Get('settings')
  getSetting(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryGradeLockDto,
  ) {
    if (!query.schoolYearId) {
      throw new BadRequestException('schoolYearId is required.');
    }
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
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryGradeLockDto,
  ) {
    return this.service.getClassLocks(orgId, query);
  }
}