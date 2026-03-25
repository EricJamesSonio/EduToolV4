// @/modules/assessment/assessment.controller.ts
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
import { AssessmentService } from './assessment.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
  QueryAssessmentDto,
  PublishScoresDto,
  GradeEssayDto,
  UpdateSubmissionStatusDto,
} from './dto/assessment.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('classes/:classId/assessments')
@UseGuards(AuthGuard, RolesGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // POST /classes/:classId/assessments
  @Post()
  @Roles('educator')
  create(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentService.create(classId, orgId, educatorId, dto);
  }

  // GET /classes/:classId/assessments
  @Get()
  @Roles('educator')
  findAll(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Query() query: QueryAssessmentDto,
  ) {
    return this.assessmentService.findAll(classId, orgId, educatorId, query);
  }

  // GET /classes/:classId/assessments/:id
  @Get(':id')
  @Roles('educator')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.assessmentService.findOne(id, orgId, educatorId);
  }

  // PATCH /classes/:classId/assessments/:id
  @Patch(':id')
  @Roles('educator')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.update(id, orgId, educatorId, dto);
  }

  // DELETE /classes/:classId/assessments/:id
  @Delete(':id')
  @Roles('educator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    await this.assessmentService.delete(id, orgId, educatorId);
  }

  // PATCH /classes/:classId/assessments/:id/questions/:questionId
  @Patch(':id/questions/:questionId')
  @Roles('educator')
  updateQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.assessmentService.updateQuestion(
      assessmentId,
      questionId,
      orgId,
      educatorId,
      dto,
    );
  }

  // GET /classes/:classId/assessments/:id/submissions
  @Get(':id/submissions')
  @Roles('educator')
  getSubmissions(
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.assessmentService.getSubmissions(assessmentId, orgId, educatorId);
  }

  // PATCH /classes/:classId/assessments/:id/submissions/:submissionId/status
  @Patch(':id/submissions/:submissionId/status')
  @Roles('educator')
  updateSubmissionStatus(
    @Param('id') assessmentId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateSubmissionStatusDto,
  ) {
    return this.assessmentService.updateSubmissionStatus(
      assessmentId,
      submissionId,
      orgId,
      educatorId,
      dto,
    );
  }

  // PATCH /classes/:classId/assessments/:id/submissions/:submissionId/grade
  @Patch(':id/submissions/:submissionId/grade')
  @Roles('educator')
  gradeEssay(
    @Param('id') assessmentId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: GradeEssayDto,
  ) {
    return this.assessmentService.gradeEssay(
      assessmentId,
      submissionId,
      orgId,
      educatorId,
      dto,
    );
  }

  // POST /classes/:classId/assessments/:id/publish
  @Post(':id/publish')
  @Roles('educator')
  publishScores(
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: PublishScoresDto,
  ) {
    return this.assessmentService.publishScores(assessmentId, orgId, educatorId, dto);
  }

  // POST /classes/:classId/assessments/:id/unpublish
  @Post(':id/unpublish')
  @Roles('educator')
  unpublishScores(
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.assessmentService.unpublishScores(assessmentId, orgId, educatorId);
  }
}