// @/modules/assessment/student/assessment-student.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AssessmentStudentService } from './assessment-student.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('student/classes/:classId/assessments')
@UseGuards(AuthGuard, RolesGuard)
@Roles('student')
export class AssessmentStudentController {
  constructor(private readonly service: AssessmentStudentService) {}

  @Get()
  getAssessments(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.service.getAssessments(classId, orgId, studentId);
  }

  @Get(':id')
  getAssessmentDetail(
    @Param('classId') classId: string,
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.service.getAssessmentDetail(
      classId,
      assessmentId,
      orgId,
      studentId,
    );
  }

  @Get(':id/result')
  getResult(
    @Param('classId') classId: string,
    @Param('id') assessmentId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.service.getResult(classId, assessmentId, orgId, studentId);
  }
}
