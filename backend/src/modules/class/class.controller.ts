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
import { ClassService } from './class.service';
import {
  CreateClassDto,
  UpdateClassDto,
  QueryClassDto,
  EnrollStudentDto,
  UpdateEnrollmentDto,
  ReassignEducatorDto,
} from './dto/class.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

// ── Educator / Admin routes ───────────────────────────────────────────────────
@Controller('classes')
@UseGuards(AuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateClassDto,
  ) {
    return this.classService.create(orgId, dto, actorId);
  }

  @Get()
  @Roles('admin', 'educator')
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryClassDto,
  ) {
    return this.classService.findAll(orgId, query);
  }

  // NEW — for the Classes page Educator filter, scoped to the currently
  // selected Department/Semester. Must stay above `@Get(':id')`, since Nest
  // matches routes in declaration order and "educators" would otherwise be
  // swallowed as an :id param.
  @Get('educators')
  @Roles('admin', 'educator')
  async getDistinctEducators(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('programId') programId?: string,
  ) {
    return this.classService.getDistinctEducators(orgId, {
      schoolYearId,
      semesterId,
      programId,
    });
  }

  @Get(':id')
  @Roles('admin', 'educator')
  async findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.classService.findById(id, orgId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    await this.classService.archive(id, orgId, actorId);
  }

  @Post(':id/enroll')
  @Roles('admin')
  async enrollStudent(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.classService.enrollStudent(id, orgId, dto, actorId);
  }

  @Get(':id/enrollments')
  @Roles('admin', 'educator')
  async getEnrollments(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.classService.getEnrollments(id, orgId);
  }

  @Get(':id/students')
  @Roles('admin', 'educator')
  async getEnrolledStudents(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.classService.getEnrolledStudents(id, orgId);
  }

  @Get(':id/eligible-students')
  @Roles('admin')
  async getEligibleStudents(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Query('search') search?: string,
  ) {
    return this.classService.getEligibleStudents(id, orgId, search);
  }

  @Patch(':classId/enrollments/:enrollmentId')
  @Roles('admin')
  async updateEnrollment(
    @Param('classId') classId: string,
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.classService.updateEnrollment(
      classId,
      enrollmentId,
      orgId,
      dto,
    );
  }

  @Delete(':classId/enrollments/:enrollmentId')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async removeEnrollment(
    @Param('classId') classId: string,
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.classService.removeEnrollment(
      classId,
      enrollmentId,
      orgId,
      actorId,
    );
  }

  @Post(':id/reassign-educator')
  @Roles('admin')
  async reassignEducator(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReassignEducatorDto,
  ) {
    return this.classService.reassignEducator(id, orgId, dto, adminId);
  }
}

// ── Educator self-view ────────────────────────────────────────────────────────
@Controller('educator')
@UseGuards(AuthGuard, RolesGuard)
export class EducatorClassController {
  constructor(private readonly classService: ClassService) {}

  @Get('classes')
  @Roles('educator', 'admin')
  async getMyClasses(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.classService.getEducatorClasses(educatorId, orgId);
  }
}

// ── Student routes ────────────────────────────────────────────────────────────
@Controller('student/classes')
@UseGuards(AuthGuard, RolesGuard)
export class StudentClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @Roles('student')
  async getMyClasses(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.classService.getStudentClasses(studentId, orgId);
  }

  @Get(':classId')
  @Roles('student')
  async getMyClass(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.classService.getStudentClassById(classId, studentId, orgId);
  }

  @Get(':id/ownership-history')
  @Roles('admin', 'educator')
  async getOwnershipHistory(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.classService.getOwnershipHistory(id, orgId);
  }
}