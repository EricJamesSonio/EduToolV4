// @/modules/assessment/assessment.student.controller.ts

import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AssessmentStudentService } from './assessment.student.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('classes/:classId/assessments')
@UseGuards(AuthGuard, RolesGuard)
export class AssessmentStudentController {
  constructor(
    private readonly assessmentStudentService: AssessmentStudentService,
  ) {}

  // ─────────────────────────────────────────
  // 📚 GET ALL ASSESSMENTS
  // ─────────────────────────────────────────
  // GET /classes/:classId/assessments
  @Get()
  @Roles('student')
  getAssessments(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.assessmentStudentService.getAssessments(
      classId,
      orgId,
      studentId,
    );
  }

  // ─────────────────────────────────────────
  // 📄 GET ASSESSMENT DETAIL
  // ─────────────────────────────────────────
  // GET /classes/:classId/assessments/:id
  @Get(':id')
  @Roles('student')
  getAssessmentDetail(
    @Param('classId') classId: string,
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.assessmentStudentService.getAssessmentDetail(
      classId,
      assessmentId,
      orgId,
      studentId,
    );
  }

  // ─────────────────────────────────────────
  // 📊 GET RESULT
  // ─────────────────────────────────────────
  // GET /classes/:classId/assessments/:id/result
  @Get(':id/result')
  @Roles('student')
  getResult(
    @Param('classId') classId: string,
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.assessmentStudentService.getResult(
      classId,
      assessmentId,
      orgId,
      studentId,
    );
  }
}