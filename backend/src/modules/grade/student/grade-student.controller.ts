import { Controller, Get, Param } from '@nestjs/common';
import { GradeStudentService } from './grade-student.service';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('student/classes/:classId/grades')
export class GradeStudentController {
  constructor(private readonly service: GradeStudentService) {}

  @Get()
  async getMyGrades(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getMyGrades(
      classId,
      user.id,
      user.orgId,
    );
  }
}