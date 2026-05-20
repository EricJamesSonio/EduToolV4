// src/modules/grade/student/grade-student.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GradeStudentService } from './grade-student.service';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('student/classes/:classId/grades')
@UseGuards(AuthGuard, RolesGuard)
export class GradeStudentController {
  constructor(private readonly service: GradeStudentService) {}

  // GET /student/classes/:classId/grades
  @Get()
  @Roles('student')
  getMyGrades(
    @Param('classId') classId: string,
    @CurrentUser('id') studentId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.getMyGrades(classId, studentId, orgId);
  }
}