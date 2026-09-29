import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubjectCompletionOverrideService } from './subject-completion-override.service';
import {
  CreateSubjectCompletionDto,
  UpdateSubjectCompletionDto,
} from './dto/subject-completion-override.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('students/:studentId/subject-completions')
export class SubjectCompletionOverrideController {
  constructor(private readonly service: SubjectCompletionOverrideService) {}

  @Get()
  @Roles('admin')
  list(
    @CurrentUser('org_id') orgId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.list(orgId, studentId);
  }

  @Get('catalog')
  @Roles('admin')
  catalog(
    @CurrentUser('org_id') orgId: string,
    @Query('search') search?: string,
  ) {
    return this.service.catalog(orgId, search);
  }

  @Get('statuses')
  @Roles('admin')
  statuses(
    @CurrentUser('org_id') orgId: string,
    @Param('studentId') studentId: string,
    @Query('subjectIds') subjectIds?: string,
  ) {
    const ids = (subjectIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.service.statuses(orgId, studentId, ids);
  }

  @Post()
  @Roles('admin')
  create(
    @CurrentUser() user: { org_id: string; id: string },
    @Param('studentId') studentId: string,
    @Body() dto: CreateSubjectCompletionDto,
  ) {
    return this.service.upsert(user.org_id, studentId, user.id, dto);
  }

  @Patch(':overrideId')
  @Roles('admin')
  update(
    @CurrentUser() user: { org_id: string; id: string },
    @Param('overrideId') overrideId: string,
    @Body() dto: UpdateSubjectCompletionDto,
  ) {
    return this.service.updateStatus(user.org_id, overrideId, user.id, dto);
  }

  @Delete(':overrideId')
  @Roles('admin')
  remove(
    @CurrentUser() user: { org_id: string; id: string },
    @Param('overrideId') overrideId: string,
    @Query('removeDependents') removeDependents?: string,
  ) {
    return this.service.remove(
      user.org_id,
      overrideId,
      user.id,
      removeDependents === 'true',
    );
  }
}
