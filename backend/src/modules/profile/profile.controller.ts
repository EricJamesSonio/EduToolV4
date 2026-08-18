import { Controller, Patch, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import {
  ChangePersonalEmailRequestDto,
  ChangePersonalEmailVerifyDto,
  UpdatePersonalEmailDto,
  UpdateProfileDto,
} from './dto/profile.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('profile')
@UseGuards(AuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser('id') accountId: string) {
    return this.profileService.getProfile(accountId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser('id') accountId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(accountId, dto);
  }

  @Patch('personal-email')
  async updatePersonalEmail(
    @CurrentUser('id') accountId: string,
    @Body() dto: UpdatePersonalEmailDto,
  ) {
    return this.profileService.updatePersonalEmail(accountId, dto);
  }

  @Post('personal-email/change-request')
  async requestPersonalEmailChange(
    @CurrentUser('id') accountId: string,
    @Body() dto: ChangePersonalEmailRequestDto,
  ) {
    return this.profileService.requestPersonalEmailChange(accountId, dto);
  }

  @Post('personal-email/change-verify')
  async verifyPersonalEmailChange(
    @CurrentUser('id') accountId: string,
    @Body() dto: ChangePersonalEmailVerifyDto,
  ) {
    return this.profileService.verifyPersonalEmailChange(accountId, dto);
  }
}
