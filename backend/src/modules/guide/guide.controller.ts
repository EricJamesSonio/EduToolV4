import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { GuideService } from './guide.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateGuideStepDto } from './dto/create-guide-step.dto';
import { UpdateGuideStepDto } from './dto/update-guide-step.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { PlatformOwnerGuard } from '@/modules/platform/guards/platform-owner.guard';

@Controller('platform/guides')
@UseGuards(AuthGuard, PlatformOwnerGuard)
export class GuideController {
  constructor(private readonly service: GuideService) {}

  // ─── GUIDE LIST ───────────────────────────────────────────────────────────

  @Get()
  getGuides(@Query('portal') portal?: string) {
    return this.service.getGuides(portal);
  }

  @Get('by-page')
  getGuideByPortalAndPath(
    @Query('portal') portal: string,
    @Query('pagePath') pagePath: string,
  ) {
    return this.service.getGuideByPortalAndPath(portal, pagePath);
  }

  @Get(':id')
  getGuide(@Param('id') id: string) {
    return this.service.getGuideById(id);
  }

  // ─── GUIDE CRUD ───────────────────────────────────────────────────────────

  @Post()
  createGuide(@Body() dto: CreateGuideDto) {
    return this.service.createGuide(dto);
  }

  @Patch(':id')
  updateGuide(@Param('id') id: string, @Body() dto: UpdateGuideDto) {
    return this.service.updateGuide(id, dto);
  }

  @Delete(':id')
  deleteGuide(@Param('id') id: string) {
    return this.service.deleteGuide(id);
  }

  // ─── GUIDE STEPS ──────────────────────────────────────────────────────────

  @Post(':guideId/steps')
  createStep(
    @Param('guideId') guideId: string,
    @Body() dto: CreateGuideStepDto,
  ) {
    return this.service.createStep(guideId, dto);
  }

  @Patch('steps/:stepId')
  updateStep(
    @Param('stepId') stepId: string,
    @Body() dto: UpdateGuideStepDto,
  ) {
    return this.service.updateStep(stepId, dto);
  }

  @Delete('steps/:stepId')
  deleteStep(@Param('stepId') stepId: string) {
    return this.service.deleteStep(stepId);
  }
}
