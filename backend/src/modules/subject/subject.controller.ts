// @/modules/subject/subject.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
} from './dto/subject.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('subjects')
@UseGuards(AuthGuard, RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  /**
   * POST /subjects  @Roles(ADMIN)
   * Admin creates a subject and optionally assigns an educator.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectService.create(orgId, dto);
  }

  /**
   * GET /subjects
   * Returns all subjects. Filterable by ?levelId= ?educatorId= ?search=
   * All authenticated roles can view.
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QuerySubjectDto,
  ) {
    return this.subjectService.findAll(orgId, query);
  }

  /**
   * PATCH /subjects/:id  @Roles(ADMIN)
   * Updates subject name, level, or educator assignment.
   * Blocked if subject is locked.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, orgId, dto);
  }

  /**
   * PATCH /subjects/:id/lock  @Roles(ADMIN)
   * Admin locks the subject when enrollment begins — makes it read-only.
   */
  @Patch(':id/lock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async lock(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.lock(id, orgId);
  }

  /**
   * PATCH /subjects/:id/unlock  @Roles(ADMIN)
   * Admin manually unlocks a subject.
   * Subjects also auto-unlock at the start of each new school year (Phase 3).
   */
  @Patch(':id/unlock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unlock(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.unlock(id, orgId);
  }
}