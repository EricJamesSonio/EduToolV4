// src/modules/grade/educator/grade-educator.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GradeEducatorService } from './grade-educator.service';
import { SetManualScoreDto } from './dto/grade-educator.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('classes/:classId/grades')
@UseGuards(AuthGuard, RolesGuard)
export class GradeEducatorController {
  constructor(private readonly service: GradeEducatorService) {}

  // GET /classes/:classId/grades
  @Get()
  @Roles('educator', 'admin')
  getGradesByClass(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.getGradesByClass(classId, orgId, educatorId);
  }

  // GET /classes/:classId/grades/term-options  (must come before :termId)
  @Get('term-options')
  @Roles('educator', 'admin')
  getTermOptions(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.getTermOptions(classId, orgId, educatorId);
  }

  // GET /classes/:classId/grades/:termId
  @Get(':termId')
  @Roles('educator', 'admin')
  getGradesByTerm(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.getGradesByTerm(classId, termId, orgId, educatorId);
  }

  // POST /classes/:classId/grades/:termId/compute
  @Post(':termId/compute')
  @Roles('educator', 'admin')
  computeGrades(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.computeGrades(classId, termId, orgId, educatorId);
  }

  // PATCH /classes/:classId/grades/:termId/students/:studentId/manual
  @Patch(':termId/students/:studentId/manual')
  @Roles('educator', 'admin')
  setManualScore(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @Param('studentId') studentId: string,
    @Body() dto: SetManualScoreDto,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.setManualScore(
      classId,
      termId,
      studentId,
      orgId,
      educatorId,
      dto,
    );
  }

  // PATCH /classes/:classId/grades/:termId/students/:studentId/publish
  @Patch(':termId/students/:studentId/publish')
  @Roles('educator', 'admin')
  publishByStudent(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.publishByStudent(classId, termId, studentId, orgId, educatorId);
  }

  // PATCH /classes/:classId/grades/:termId/students/:studentId/unlock
  @Patch(':termId/students/:studentId/unlock')
  @Roles('educator', 'admin')
  unlockByStudent(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.unlockByStudent(classId, termId, studentId, orgId, educatorId);
  }
}