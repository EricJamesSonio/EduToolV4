// @/modules/attendance/student/attendance-student.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AttendanceStudentService } from './attendance-student.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('student/classes/:classId/attendance')
@UseGuards(AuthGuard, RolesGuard)
export class AttendanceStudentController {
  constructor(private readonly service: AttendanceStudentService) {}

  // GET /student/classes/:classId/attendance
  @Get()
  @Roles('student')
  getMyAttendance(
    @Param('classId') classId: string,
    @CurrentUser('id') studentId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.service.getMyAttendance(classId, studentId, orgId);
  }
}