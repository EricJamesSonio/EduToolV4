import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentEnrollmentService } from './student-enrollment.service';
import {
  EnrollStudentDto,
  BulkEnrollStudentsDto,
  UpdateSchoolYearEnrollmentDto,
  EnrollStudentProgramDto,
  UpdateProgramEnrollmentDto,
  PaginatedEnrollmentQueryDto,
} from './dto/student-enrollment.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('school-years/:schoolYearId/enrollments')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class StudentEnrollmentController {
  constructor(private readonly service: StudentEnrollmentService) {}

  // ── School-Year Enrollment ────────────────────────────────────────────────

  @Get()
  getAll(
    @Param('schoolYearId') schoolYearId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Query() query: PaginatedEnrollmentQueryDto,
  ) {
    return this.service.getEnrolledStudents(
      schoolYearId,
      user.org_id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post()
  enroll(
    @Param('schoolYearId') schoolYearId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: EnrollStudentDto,
  ) {
    return this.service.enrollStudent(schoolYearId, user.org_id, dto, user.id);
  }

  @Post('bulk')
  bulkEnroll(
    @Param('schoolYearId') schoolYearId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: BulkEnrollStudentsDto,
  ) {
    return this.service.bulkEnrollStudents(
      schoolYearId,
      user.org_id,
      dto,
      user.id,
    );
  }

  @Patch(':enrollmentId')
  updateEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: UpdateSchoolYearEnrollmentDto,
  ) {
    return this.service.updateEnrollment(
      enrollmentId,
      user.org_id,
      dto,
      user.id,
    );
  }

  @Delete(':enrollmentId')
  unenroll(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: { org_id: string; id: string },
  ) {
    return this.service.unenrollStudent(enrollmentId, user.org_id, user.id);
  }

  @Post('students/:studentId/programs')
  enrollInProgram(
    @Param('schoolYearId') schoolYearId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: EnrollStudentProgramDto,
  ) {
    return this.service.enrollInProgram(
      schoolYearId,
      studentId,
      user.org_id,
      dto,
      user.id,
    );
  }

  @Patch('programs/:programEnrollmentId')
  updateProgramEnrollment(
    @Param('programEnrollmentId') programEnrollmentId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: UpdateProgramEnrollmentDto,
  ) {
    return this.service.updateProgramEnrollment(
      programEnrollmentId,
      user.org_id,
      dto,
      user.id,
    );
  }

  @Delete('programs/:programEnrollmentId')
  removeProgramEnrollment(
    @Param('programEnrollmentId') programEnrollmentId: string,
    @CurrentUser() user: { org_id: string; id: string },
  ) {
    return this.service.removeProgramEnrollment(
      programEnrollmentId,
      user.org_id,
      user.id,
    );
  }
}
