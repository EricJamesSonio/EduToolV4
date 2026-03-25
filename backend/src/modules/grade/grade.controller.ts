// src/modules/grade/grade.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GradeService } from './grade.service';
import { SetManualScoreDto } from './dto/grade.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('classes/:classId/grades')
@UseGuards(AuthGuard, RolesGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  // GET /classes/:classId/grades
  @Get()
  @Roles('educator', 'admin')
  getGradesByClass(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.gradeService.getGradesByClass(classId, orgId, educatorId);
  }

  // GET /classes/:classId/grades/:termId
  @Get(':termId')
  @Roles('educator', 'admin')
  getGradesByTerm(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.gradeService.getGradesByTerm(classId, termId, orgId, educatorId);
  }

  // POST /classes/:classId/grades/:termId/compute
  @Post(':termId/compute')
  @Roles('educator', 'admin')
  computeGrades(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.gradeService.computeGrades(classId, termId, orgId, educatorId);
  }

  // PATCH /classes/:classId/grades/:termId/students/:studentId/manual
  @Patch(':termId/students/:studentId/manual')
  @Roles('educator', 'admin')
  setManualScore(
    @Param('classId') classId: string,
    @Param('termId') termId: string,
    @Param('studentId') studentId: string,
    @Body() dto: SetManualScoreDto,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.gradeService.setManualScore(
      classId,
      termId,
      studentId,
      orgId,
      educatorId,
      dto,
    );
  }
}