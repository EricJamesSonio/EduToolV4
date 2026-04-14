// ===== File: backend/src/modules/grade-lock/grade-lock.controller.ts =====

import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { BadRequestException } from '@nestjs/common'
import { GradeLockService } from './grade-lock.service'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'
import { CreateGradeLockSettingDto, QueryGradeLockDto } from './dto/grade-lock.dto'

@Controller('grade-lock')
@UseGuards(AuthGuard, RolesGuard)
export class GradeLockController {
  constructor(private readonly service: GradeLockService) {}

  /**
   * ADMIN: Create/update lock deadline for a school year
   * POST /grade-lock/settings
   */
  @Post('settings')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createSetting(
    @CurrentUser() user: any,
    @Body() dto: CreateGradeLockSettingDto,
  ) {
    const orgId = user.org_id
    return this.service.createSetting(orgId, dto)
  }

  /**
   * GET: Fetch lock deadline for a school year
   * GET /grade-lock/settings?schoolYearId=XXX
   */
  @Get('settings')
  @HttpCode(HttpStatus.OK)
  async getSetting(
    @CurrentUser() user: any,
    @Query() query: QueryGradeLockDto,
  ) {
    if (!query.schoolYearId) {
      throw new BadRequestException('schoolYearId is required')
    }
    const orgId = user.org_id
    const setting = await this.service.getSetting(orgId, query.schoolYearId)
    return setting || { message: 'No deadline set for this school year' }
  }

  /**
   * EDUCATOR: Manually lock their class (before deadline)
   * POST /grade-lock/:classId/lock
   */
  @Post(':classId/lock')
  @Roles('educator')
  @HttpCode(HttpStatus.OK)
  async lockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id
    const orgId = user.org_id
    return this.service.lockClass(classId, userId, orgId)
  }

  /**
   * EDUCATOR/ADMIN: Unlock a class
   * - Educators can unlock BEFORE deadline
   * - Admins can unlock ANYTIME (override)
   * POST /grade-lock/:classId/unlock
   */
  @Post(':classId/unlock')
  @Roles('educator', 'admin')
  @HttpCode(HttpStatus.OK)
  async unlockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id
    const userRole = user.role
    const orgId = user.org_id
    return this.service.unlockClass(classId, userId, userRole, orgId)
  }

  /**
   * ADMIN: Get all class locks for organization
   * GET /grade-lock/classes
   */
  @Get('classes')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getClassLocks(@CurrentUser() user: any) {
    const orgId = user.org_id
    return this.service.getClassLocks(orgId)
  }

  /**
   * INTERNAL: Auto-lock expired classes (can be called by scheduler)
   * POST /grade-lock/auto-lock
   */
  @Post('auto-lock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async autoLock(@CurrentUser() user: any) {
    const orgId = user.org_id
    return this.service.autoLockExpiredClasses(orgId)
  }
}