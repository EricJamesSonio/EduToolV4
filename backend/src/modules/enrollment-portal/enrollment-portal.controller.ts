// src/modules/enrollment-portal/enrollment-portal.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentPortalService } from './enrollment-portal.service';
import { EnrollmentSessionGuard } from './enrollment-session.guard';
import { EnrollmentSession } from './enrollment-session.decorator';
import {
  LookupEnrollmentApplicationQueryDto,
  SendEnrollmentOtpDto,
  UpsertEnrollmentApplicationDto,
  VerifyEnrollmentOtpDto,
} from './dto/enrollment-portal.dto';
import type { EnrollmentSessionClaims } from './entity/enrollment-portal.entity';

@Controller('enroll')
export class EnrollmentPortalController {
  constructor(private readonly service: EnrollmentPortalService) {}

  // NOTE: the two-segment param route (`:orgSlug/:periodToken`) is declared
  // AFTER the specific `lookup/...` routes so Express matches the concrete
  // path first.

  @Get('lookup/:applicationCode')
  async lookup(
    @Param('applicationCode') applicationCode: string,
    @Query() query: LookupEnrollmentApplicationQueryDto,
  ) {
    return this.service.lookupApplication(applicationCode, query.email);
  }

  @Get(':orgSlug/:periodToken')
  async getPortal(
    @Param('orgSlug') orgSlug: string,
    @Param('periodToken') periodToken: string,
  ) {
    return this.service.getPortal(orgSlug, periodToken);
  }

  @Post(':orgSlug/:periodToken/otp')
  async sendOtp(
    @Param('orgSlug') orgSlug: string,
    @Param('periodToken') periodToken: string,
    @Body() dto: SendEnrollmentOtpDto,
  ) {
    return this.service.sendOtp(orgSlug, periodToken, dto);
  }

  @Post(':orgSlug/:periodToken/otp/verify')
  async verifyOtp(
    @Param('orgSlug') orgSlug: string,
    @Param('periodToken') periodToken: string,
    @Body() dto: VerifyEnrollmentOtpDto,
  ) {
    return this.service.verifyOtpAndOpenSession(orgSlug, periodToken, dto);
  }

  @Post(':orgSlug/:periodToken/application')
  @UseGuards(EnrollmentSessionGuard)
  async createApplication(
    @Param('orgSlug') orgSlug: string,
    @Param('periodToken') periodToken: string,
    @EnrollmentSession() session: EnrollmentSessionClaims,
    @Body() dto: UpsertEnrollmentApplicationDto,
  ) {
    return this.service.createApplication(orgSlug, periodToken, session, dto);
  }

  @Patch(':orgSlug/:periodToken/application')
  @UseGuards(EnrollmentSessionGuard)
  async updateApplication(
    @Param('orgSlug') orgSlug: string,
    @Param('periodToken') periodToken: string,
    @EnrollmentSession() session: EnrollmentSessionClaims,
    @Body() dto: UpsertEnrollmentApplicationDto,
  ) {
    return this.service.updateApplication(orgSlug, periodToken, session, dto);
  }
}
