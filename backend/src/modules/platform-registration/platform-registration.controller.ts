import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlatformRegistrationService } from './platform-registration.service';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { PlatformOwnerGuard } from '@/modules/platform/guards/platform-owner.guard';

@Controller('platform/registration-requests')
@UseGuards(AuthGuard, PlatformOwnerGuard)
export class PlatformRegistrationController {
  constructor(
    private readonly service: PlatformRegistrationService,
  ) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list({
      search,
      status,
      page: parseInt(page ?? '1', 10),
      limit: parseInt(limit ?? '10', 10),
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveRequestDto,
  ) {
    return this.service.approve(id, dto);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Post(':id/send-credentials')
  @HttpCode(HttpStatus.OK)
  async sendCredentials(@Param('id') id: string) {
    return this.service.sendCredentials(id);
  }
}
