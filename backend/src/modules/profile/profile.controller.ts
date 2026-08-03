import {
  Controller,
  Patch,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common'
import { ProfileService }          from './profile.service'
import { UpdatePersonalEmailDto, UpdateProfileDto }  from './dto/profile.dto'
import { AuthGuard }               from '@/commons/guards/auth.guard'
import { RolesGuard }              from '@/commons/guards/role.guard'
import { CurrentUser }             from '@/commons/decorators/current-user.decorator'

@Controller('profile')
@UseGuards(AuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser('id') accountId: string) {
    return this.profileService.getProfile(accountId)
  }

  @Patch()
  async updateProfile(
    @CurrentUser('id') accountId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(accountId, dto)
  }

  @Patch('personal-email')
  async updatePersonalEmail(
    @CurrentUser('id') accountId: string,
    @Body() dto: UpdatePersonalEmailDto,
  ) {
    return this.profileService.updatePersonalEmail(accountId, dto)
  }
}