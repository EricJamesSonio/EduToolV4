import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SectionService } from './section.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  QuerySectionDto,
} from './dto/section.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('sections')
@UseGuards(AuthGuard, RolesGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionService.create(orgId, dto, actorId);
  }

  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QuerySectionDto,
  ) {
    return this.sectionService.findAll(orgId, query);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionService.update(id, orgId, dto, actorId);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    await this.sectionService.remove(id, orgId, actorId);
  }
}
