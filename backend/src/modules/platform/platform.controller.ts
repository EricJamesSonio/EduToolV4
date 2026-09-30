import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { PlatformService } from './platform.service';
import { LoginPlatformDto } from './dto/login-platform.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GetAdminsDto } from './dto/get-admins.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';

@Controller('platform')
export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  @Post('login')
  // Platform-owner login is effectively root access — strictest limit here.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginPlatformDto) {
    return this.service.login(dto.password);
  }

  // ─── PROTECTED (platform_owner only) ──────────────────────────────────────

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.service.createAdmin(dto);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Get('admins')
  getAdmins(@Query() query: GetAdminsDto) {
    return this.service.getAdmins(query);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Get('schools')
  getSchools(
    @Query() query: { search?: string; page?: number; limit?: number },
  ) {
    return this.service.getSchools(query);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Get('admins/:id')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Patch('admins/:id/block')
  block(@Param('id') id: string) {
    return this.service.blockAdmin(id);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Patch('admins/:id/unblock')
  unblock(@Param('id') id: string) {
    return this.service.unblockAdmin(id);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Post('admins/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.service.resetPassword(id);
  }
}
