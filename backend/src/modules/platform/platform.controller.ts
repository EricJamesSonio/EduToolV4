import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { PlatformService } from './platform.service';
import { LoginPlatformDto } from './dto/login-platform.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PlatformOwnerGuard } from './guards/platform-owner.guard';

@Controller('platform')
export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  // 🔐 LOGIN (public)
  @Post('login')
  login(@Body() dto: LoginPlatformDto) {
    return this.service.login(dto.password);
  }

  // 🔒 ADMIN ROUTES (protected)
  @UseGuards(PlatformOwnerGuard)

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.service.createAdmin(dto);
  }

  @Get('admins')
  getAdmins() {
    return this.service.getAdmins();
  }

  @Get('admins/:id')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @Patch('admins/:id/block')
  block(@Param('id') id: string) {
    return this.service.blockAdmin(id);
  }

  @Patch('admins/:id/unblock')
  unblock(@Param('id') id: string) {
    return this.service.unblockAdmin(id);
  }

  @Post('admins/:id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.service.resetPassword(id, dto.password);
  }
}