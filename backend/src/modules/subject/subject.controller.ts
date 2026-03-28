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
} from '@nestjs/common'
import { SubjectService } from './subject.service'
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
} from './dto/subject.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

@Controller('subjects')
@UseGuards(AuthGuard, RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectService.create(orgId, dto)
  }

  /**
   * GET /subjects
   * Supports filtering by courseId, strandId, scope, yearLevel, termLabel.
   *
   * Examples:
   *   GET /subjects?courseId=xxx          → open subjects + BSCS majors
   *   GET /subjects?scope=open            → only open/minor subjects
   *   GET /subjects?scope=coupled         → only course-coupled majors
   *   GET /subjects?courseId=xxx&yearLevel=1st Year&termLabel=1st Sem
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QuerySubjectDto,
  ) {
    return this.subjectService.findAll(orgId, query)
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.findById(id, orgId)
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, orgId, dto)
  }

  @Patch(':id/lock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async lock(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.lock(id, orgId)
  }

  @Patch(':id/unlock')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unlock(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.unlock(id, orgId)
  }
}