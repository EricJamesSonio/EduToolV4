import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GradeLockService } from './grade-lock.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import {
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
  AssignSettingDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
  RequestUnlockDto,
  GrantUnlockDto,
  DenyUnlockDto,
} from './dto/grade-lock.dto';

@Controller('grade-lock')
@UseGuards(AuthGuard, RolesGuard)
export class GradeLockController {
  constructor(private readonly service: GradeLockService) {}

  // ─── Settings ──────────────────────────────────────────────────────────────

  @Post('settings')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  createSetting(
    @CurrentUser() user: any,
    @Body() dto: CreateGradeLockSettingDto,
  ) {
    return this.service.createSetting(user.org_id, dto);
  }

  @Get('settings')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  getSettings(@CurrentUser() user: any) {
    return this.service.getSettings(user.org_id);
  }

  @Get('settings/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  getSetting(@CurrentUser() user: any, @Param('id') settingId: string) {
    return this.service.getSetting(user.org_id, settingId);
  }

  @Put('settings/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  updateSetting(
    @CurrentUser() user: any,
    @Param('id') settingId: string,
    @Body() dto: UpdateGradeLockSettingDto,
  ) {
    return this.service.updateSetting(user.org_id, settingId, dto);
  }

  @Delete('settings/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deleteSetting(@CurrentUser() user: any, @Param('id') settingId: string) {
    return this.service.deleteSetting(user.org_id, settingId);
  }

  // ─── Assignment ────────────────────────────────────────────────────────────

  @Post('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  assignSetting(@CurrentUser() user: any, @Body() dto: AssignSettingDto) {
    return this.service.assignSetting(user.org_id, user.id, dto);
  }

  // ─── Lock Actions ──────────────────────────────────────────────────────────

  @Post(':classId/lock')
  @Roles('educator')
  @HttpCode(HttpStatus.OK)
  lockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: LockClassDto,
  ) {
    return this.service.lockClass(classId, user.id, user.org_id, dto);
  }

  @Post(':classId/unlock')
  @Roles('educator', 'admin')
  @HttpCode(HttpStatus.OK)
  unlockClass(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: UnlockClassDto,
  ) {
    return this.service.unlockClass(
      classId,
      user.id,
      user.role,
      user.org_id,
      dto,
    );
  }

  @Post(':classId/override')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  overrideLock(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: OverrideGradeLockDto,
  ) {
    return this.service.overrideLock(classId, user.id, user.org_id, dto);
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  @Get('classes')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  getClassLocks(
    @CurrentUser() user: any,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    if (schoolYearId) {
      return this.service.getClassLocksBySchoolYear(user.org_id, schoolYearId);
    }
    return this.service.getClassLocks(user.org_id);
  }

  @Get(':classId/events')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  getEventsForClass(
    @CurrentUser() user: any,
    @Param('classId') classId: string,
  ) {
    return this.service.getEventsForClass(user.org_id, classId);
  }

  // ─── Auto-lock ─────────────────────────────────────────────────────────────

  @Post('auto-lock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  autoLock(@CurrentUser() user: any) {
    return this.service.autoLockExpiredClasses(user.org_id);
  }

  // ─── Unlock Requests ─────────────────────────────────────────────────────────

  @Get('unlock-requests')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  getUnlockRequests(@CurrentUser() user: any) {
    return this.service.getUnlockRequests(user.org_id);
  }

  @Get(':classId/info')
  @Roles('educator', 'admin')
  @HttpCode(HttpStatus.OK)
  getClassLockInfo(
    @CurrentUser() user: any,
    @Param('classId') classId: string,
  ) {
    return this.service.getClassLockInfo(classId, user.org_id);
  }

  @Post(':classId/request-unlock')
  @Roles('educator')
  @HttpCode(HttpStatus.OK)
  requestUnlock(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: RequestUnlockDto,
  ) {
    return this.service.requestUnlock(classId, user.id, user.org_id, dto);
  }

  @Post(':classId/grant-unlock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  grantUnlock(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: GrantUnlockDto,
  ) {
    return this.service.grantUnlock(classId, user.id, user.org_id, dto);
  }

  @Post(':classId/deny-unlock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  denyUnlock(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Body() dto: DenyUnlockDto,
  ) {
    return this.service.denyUnlock(classId, user.id, user.org_id, dto.reason);
  }
}
