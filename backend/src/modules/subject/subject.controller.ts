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
} from '@nestjs/common'
import { SubjectService } from './subject.service'
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  ShareSubjectDto,
} from './dto/subject.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

@Controller('subjects')
@UseGuards(AuthGuard, RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // ---------------------------------------------------------------------------
  // Core CRUD
  // ---------------------------------------------------------------------------

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectService.create(orgId, dto)
  }

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

  // ---------------------------------------------------------------------------
  // Sharing (minor subjects only)
  // ---------------------------------------------------------------------------

  @Post(':id/share')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async share(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: ShareSubjectDto,
  ) {
    return this.subjectService.share(id, orgId, dto)
  }

  @Delete(':id/share/:sharingId')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unshare(
    @Param('id') id: string,
    @Param('sharingId') sharingId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.unshare(id, sharingId, orgId)
  }

  @Get(':id/sharings')
  async findSharings(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subjectService.findSharings(id, orgId)
  }
}