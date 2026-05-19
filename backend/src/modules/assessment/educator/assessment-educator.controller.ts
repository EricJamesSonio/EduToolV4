// @/modules/assessment/educator/assessment-educator.controller.ts
import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AssessmentEducatorService } from './assessment-educator.service';
import {
  CreateAssessmentDto, UpdateAssessmentDto, UpdateQuestionDto,
  QueryAssessmentDto, PublishScoresDto, GradeEssayDto, UpdateSubmissionStatusDto, AssignStudentsDto,
} from '../dto/assessment.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('classes/:classId/assessments')
@UseGuards(AuthGuard, RolesGuard)
@Roles('educator')
export class AssessmentEducatorController {
  constructor(private readonly service: AssessmentEducatorService) {}

  @Post()
  create(@Param('classId') classId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: CreateAssessmentDto) {
    return this.service.create(classId, orgId, educatorId, dto);
  }

  @Get()
  findAll(@Param('classId') classId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Query() query: QueryAssessmentDto) {
    return this.service.findAll(classId, orgId, educatorId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string) {
    return this.service.findOne(id, orgId, educatorId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: UpdateAssessmentDto) {
    return this.service.update(id, orgId, educatorId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string) {
    await this.service.delete(id, orgId, educatorId);
  }

  @Patch(':id/questions/:questionId')
  updateQuestion(@Param('id') assessmentId: string, @Param('questionId') questionId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(assessmentId, questionId, orgId, educatorId, dto);
  }

  @Get(':id/submissions')
  getSubmissions(@Param('id') assessmentId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string) {
    return this.service.getSubmissions(assessmentId, orgId, educatorId);
  }

  @Patch(':id/submissions/:submissionId/status')
  updateSubmissionStatus(@Param('id') assessmentId: string, @Param('submissionId') submissionId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: UpdateSubmissionStatusDto) {
    return this.service.updateSubmissionStatus(assessmentId, submissionId, orgId, educatorId, dto);
  }

  @Patch(':id/submissions/:submissionId/grade')
  gradeEssay(@Param('id') assessmentId: string, @Param('submissionId') submissionId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: GradeEssayDto) {
    return this.service.gradeEssay(assessmentId, submissionId, orgId, educatorId, dto);
  }

  @Post(':id/publish')
  publishScores(@Param('id') assessmentId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: PublishScoresDto) {
    return this.service.publishScores(assessmentId, orgId, educatorId, dto);
  }

  @Post(':id/unpublish')
  unpublishScores(@Param('id') assessmentId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string) {
    return this.service.unpublishScores(assessmentId, orgId, educatorId);
  }

  @Post(':id/assign-students')
  assignStudents(@Param('id') assessmentId: string, @CurrentUser('org_id') orgId: string, @CurrentUser('id') educatorId: string, @Body() dto: AssignStudentsDto) {
    return this.service.assignStudents(assessmentId, orgId, educatorId, dto);
  }
}