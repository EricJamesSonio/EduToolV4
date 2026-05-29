import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PresentationService } from './presentation.service';
import { CreatePresentationDto, UpdatePresentationDto, GenerateSlidesDto } from './dto/presentation.dto';

@Controller('educator/classes/:classId/presentations')
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @Post()
  async create(
    @Param('classId') classId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parsed = CreatePresentationDto.parse(body);
    const orgId = req['orgId'] as string;
    const educatorId = req['userId'] as string;
    return this.service.create(orgId, classId, educatorId, parsed);
  }

  @Get()
  async findAll(
    @Param('classId') classId: string,
    @Req() req: Request,
  ) {
    const orgId = req['orgId'] as string;
    return this.service.findAll(orgId, classId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const orgId = req['orgId'] as string;
    return this.service.findOne(id, orgId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parsed = UpdatePresentationDto.parse(body);
    const orgId = req['orgId'] as string;
    return this.service.update(id, orgId, parsed);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const orgId = req['orgId'] as string;
    await this.service.delete(id, orgId);
  }

  @Post(':id/slides')
  async generateSlides(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parsed = GenerateSlidesDto.parse(body);
    const orgId = req['orgId'] as string;
    return this.service.generateSlides(orgId, id, parsed.slides);
  }

  @Post(':id/auto-generate')
  async autoGenerate(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const orgId = req['orgId'] as string;
    return this.service.autoGenerate(orgId, id);
  }
}
