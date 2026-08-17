import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PresentationService } from './presentation.service';
import {
  CreatePresentationDto,
  UpdatePresentationDto,
  GenerateSlidesDto,
} from './dto/presentation.dto';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { AuthGuard } from '@/commons/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('educator/classes/:classId/presentations')
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @Post()
  async create(
    @Param('classId') classId: string,
    @Body() body: any,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('sub') educatorId: string,
  ) {
    const parsed = CreatePresentationDto.parse(body);
    return this.service.create(orgId, classId, educatorId, parsed);
  }

  @Get()
  async findAll(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findAll(orgId, classId);
  }

  @Get('lesson/:lessonId')
  async findByLesson(
    @Param('classId') classId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.findByLesson(orgId, classId, lessonId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.service.findOne(id, orgId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('org_id') orgId: string,
  ) {
    const parsed = UpdatePresentationDto.parse(body);
    return this.service.update(id, orgId, parsed);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    await this.service.delete(id, orgId);
  }

  @Post(':id/slides')
  async generateSlides(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('org_id') orgId: string,
  ) {
    const parsed = GenerateSlidesDto.parse(body);
    return this.service.generateSlides(orgId, id, parsed.slides);
  }

  @Post(':id/auto-generate')
  async autoGenerate(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.autoGenerate(orgId, id);
  }
}
