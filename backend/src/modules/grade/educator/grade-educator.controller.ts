// src/modules/grade/educator/grade-educator.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GradeEducatorService } from './grade-educator.service';
import {
  SetManualScoreDto,
  SetAssessmentStatusOverrideDto,
} from './dto/grade-educator.dto';
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
    return this.service.publishByStudent(
      classId,
      termId,
      studentId,
      orgId,
      educatorId,
    );
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
    return this.service.unlockByStudent(
      classId,
      termId,
      studentId,
      orgId,
      educatorId,
    );
  }

  // GET /classes/:classId/grades/students/:studentId/assessments/status
  @Get('students/:studentId/assessments/status')
  @Roles('educator', 'admin')
  getAssessmentStatuses(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.getAssessmentStatuses(
      classId,
      studentId,
      orgId,
      educatorId,
    );
  }

  // POST /classes/:classId/grades/students/:studentId/assessments/:assessmentId/override
  @Post('students/:studentId/assessments/:assessmentId/override')
  @Roles('educator', 'admin')
  setAssessmentStatusOverride(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: SetAssessmentStatusOverrideDto,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.setAssessmentStatusOverride(
      classId,
      assessmentId,
      studentId,
      orgId,
      educatorId,
      dto,
    );
  }

  // DELETE /classes/:classId/grades/students/:studentId/assessments/:assessmentId/override
  @Delete('students/:studentId/assessments/:assessmentId/override')
  @Roles('educator', 'admin')
  deleteAssessmentStatusOverride(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Param('assessmentId') assessmentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.deleteAssessmentStatusOverride(
      classId,
      assessmentId,
      studentId,
      orgId,
      educatorId,
    );
  }
}
