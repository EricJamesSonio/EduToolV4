// filepath: src/modules/subject/subject.controller.ts

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
import { SubjectService } from './subject.service';
import { EducatorSubjectService } from '../educator/educator-subject.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  ShareSubjectDto,
  SubjectHierarchyQueryDto,
} from './dto/subject.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('subjects')
@UseGuards(AuthGuard, RolesGuard)
export class SubjectController {
  constructor(
    private readonly subjectService: SubjectService,
    private readonly educatorSubjectService: EducatorSubjectService,
  ) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectService.create(orgId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QuerySubjectDto,
  ) {
    return this.subjectService.findAll(orgId, query);
  }

  @Get('hierarchy')
  @Roles('admin', 'educator')
  async hierarchy(
    @CurrentUser('org_id') orgId: string,
    @Query() query: SubjectHierarchyQueryDto,
  ) {
    return this.subjectService.getHierarchy(orgId, query);
  }

  /**
   * GET /subjects/:id/educators
   * Educators who can teach this subject. Drives the "suggested" ordering in
   * the class dialog. Declared before `:id` so it is not shadowed by it.
   */
  @Get(':id/educators')
  @Roles('admin')
  async listEducators(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorSubjectService.listEducatorsForSubject(orgId, id);
  }

  @Get(':id/deletion-check')
  @Roles('admin')
  async deletionCheck(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.subjectService.deletionCheck(id, orgId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.subjectService.findById(id, orgId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, orgId, dto);
  }

  @Patch(':id/lock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async lock(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.subjectService.lock(id, orgId);
  }

  @Patch(':id/unlock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unlock(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.subjectService.unlock(id, orgId);
  }

  @Post(':id/share')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async share(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: ShareSubjectDto,
  ) {
    return this.subjectService.share(id, orgId, dto);
  }

  @Patch(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subjectService.restore(id, orgId, actorId);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subjectService.remove(id, orgId, actorId);
  }

  @Delete(':id/share/:sharingId')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unshare(
    @Param('id') id: string,
    @Param('sharingId') sharingId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.subjectService.unshare(id, sharingId, orgId);
  }

  @Get(':id/sharings')
  async findSharings(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.subjectService.findSharings(id, orgId);
  }
}
