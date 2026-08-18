// @/modules/submission/submission.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SaveDraftDto, FinishSubmissionDto } from './dto/submission.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('assessments/:assessmentId')
@UseGuards(AuthGuard, RolesGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  // POST /assessments/:assessmentId/submit
  // Student starts or resumes their attempt
  @Post('submit')
  @Roles('student')
  startOrResume(
    @Param('assessmentId') assessmentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.submissionService.startOrResume(assessmentId, orgId, studentId);
  }

  // PATCH /assessments/:assessmentId/submit/save
  // Student auto-saves draft answers
  @Patch('submit/save')
  @Roles('student')
  saveDraft(
    @Param('assessmentId') assessmentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.submissionService.saveDraft(
      assessmentId,
      orgId,
      studentId,
      dto,
    );
  }

  // POST /assessments/:assessmentId/submit/finish
  // Student final submits — triggers auto-grading
  @Post('submit/finish')
  @Roles('student')
  finish(
    @Param('assessmentId') assessmentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: FinishSubmissionDto,
  ) {
    return this.submissionService.finish(assessmentId, orgId, studentId, dto);
  }

  // GET /assessments/:assessmentId/submissions/:submissionId/answers
  // Educator views a student's submitted answers
  @Get('submissions/:submissionId/answers')
  @Roles('educator', 'admin')
  getAnswers(
    @Param('assessmentId') assessmentId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.submissionService.getAnswers(assessmentId, submissionId, orgId);
  }
}
