import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlatformRegistrationService } from './platform-registration.service';
import {
  RejectRequestDto,
  RequestRevisionDto,
} from './dto/approve-request.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { PlatformOwnerGuard } from '@/modules/platform/guards/platform-owner.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

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
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.service.approve(id, reviewerId);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.service.reject(id, reviewerId, dto);
  }

  @Patch(':id/request-revision')
  @HttpCode(HttpStatus.OK)
  async requestRevision(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.service.requestRevision(id, reviewerId, dto);
  }

  @Post(':id/send-credentials')
  @HttpCode(HttpStatus.OK)
  async sendCredentials(@Param('id') id: string) {
    return this.service.sendCredentials(id);
  }
}
