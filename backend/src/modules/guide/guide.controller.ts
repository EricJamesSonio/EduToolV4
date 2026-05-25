import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { GuideService } from './guide.service';
import { ImageStorageService } from './services/image-storage.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateGuideStepDto } from './dto/create-guide-step.dto';
import { UpdateGuideStepDto } from './dto/update-guide-step.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { PlatformOwnerGuard } from '@/modules/platform/guards/platform-owner.guard';

@Controller('platform/guides')
export class GuideController {
  constructor(
    private readonly service: GuideService,
    private readonly storage: ImageStorageService,
  ) {}

  // ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // ─── AUTHENTICATED ENDPOINTS ──────────────────────────────────────────────

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Get()
  getGuides(@Query('portal') portal?: string) {
    return this.service.getGuides(portal);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Get(':id')
  getGuide(@Param('id') id: string) {
    return this.service.getGuideById(id);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Post()
  createGuide(@Body() dto: CreateGuideDto) {
    return this.service.createGuide(dto);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Patch(':id')
  updateGuide(@Param('id') id: string, @Body() dto: UpdateGuideDto) {
    return this.service.updateGuide(id, dto);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Delete(':id')
  deleteGuide(@Param('id') id: string) {
    return this.service.deleteGuide(id);
  }

  // ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storage.upload(file);
    return { url };
  }

  // ─── GUIDE STEPS ──────────────────────────────────────────────────────────

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Post(':guideId/steps')
  createStep(
    @Param('guideId') guideId: string,
    @Body() dto: CreateGuideStepDto,
  ) {
    return this.service.createStep(guideId, dto);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Patch('steps/:stepId')
  updateStep(
    @Param('stepId') stepId: string,
    @Body() dto: UpdateGuideStepDto,
  ) {
    return this.service.updateStep(stepId, dto);
  }

  @UseGuards(AuthGuard, PlatformOwnerGuard)
  @Delete('steps/:stepId')
  deleteStep(@Param('stepId') stepId: string) {
    return this.service.deleteStep(stepId);
  }
}
