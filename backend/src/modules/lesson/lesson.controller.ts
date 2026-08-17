// @/modules/lesson/lesson.controller.ts
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
import { LessonService } from './lesson.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
} from './dto/lesson.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

// ── Educator routes ───────────────────────────────────────────────────────────

@Controller('educator/classes/:classId/lessons')
@UseGuards(AuthGuard, RolesGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  // POST /classes/:classId/lessons
  @Post()
  @Roles('educator')
  create(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonService.create(classId, orgId, educatorId, dto);
  }

  // GET /classes/:classId/lessons
  @Get()
  @Roles('educator')
  findAll(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Query() query: QueryLessonDto,
  ) {
    return this.lessonService.findAll(classId, orgId, educatorId, query);
  }

  @Get('week-structure')
  @Roles('educator', 'student')
  getWeekStructure(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.lessonService.getWeekStructure(classId, orgId, educatorId);
  }

  // GET /classes/:classId/lessons/:id
  @Get(':id')
  @Roles('educator')
  findOne(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.lessonService.findOne(id, orgId, educatorId);
  }

  // PATCH /classes/:classId/lessons/:id
  @Patch(':id')
  @Roles('educator')
  update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonService.update(id, orgId, educatorId, dto);
  }

  // DELETE /classes/:classId/lessons/:id
  @Delete(':id')
  @Roles('educator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    await this.lessonService.delete(id, orgId, educatorId);
  }

  // GET /classes/:classId/lessons/:id/concept
  @Get(':id/concept')
  @Roles('educator')
  getConcept(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.lessonService.getConcept(id, orgId, educatorId);
  }

  // POST /classes/:classId/lessons/:id/re-extract
  @Post(':id/re-extract')
  @Roles('educator')
  reExtract(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body('detail') detail: string,
  ) {
    return this.lessonService.reExtractConcept(id, orgId, educatorId, detail);
  }

  // POST /classes/:classId/lessons/:id/concept-build
  @Post(':id/concept-build')
  @Roles('educator')
  conceptBuild(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body('detail') detail: string,
  ) {
    return this.lessonService.conceptBuild(id, orgId, educatorId, detail);
  }
}

// ── Student routes ────────────────────────────────────────────────────────────

@Controller('student/classes/:classId/lessons')
@UseGuards(AuthGuard, RolesGuard)
export class StudentLessonController {
  constructor(private readonly lessonService: LessonService) {}

  // GET /student/classes/:classId/lessons
  // Optional ?weekNumber= filter
  @Get()
  @Roles('student')
  getMyLessons(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
    @Query('weekNumber') weekNumber?: number,
  ) {
    return this.lessonService.getStudentLessons(
      classId,
      studentId,
      orgId,
      weekNumber ? Number(weekNumber) : undefined,
    );
  }

  // GET /student/classes/:classId/lessons/:lessonId
  @Get(':lessonId')
  @Roles('student')
  getMyLesson(
    @Param('classId') classId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.lessonService.getStudentLesson(
      classId,
      lessonId,
      studentId,
      orgId,
    );
  }
}
