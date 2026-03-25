// @/modules/class/class.controller.ts
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

  // POST /classes  (admin)
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateClassDto,
  ) {
    return this.classService.create(orgId, dto);
  }

  // GET /classes  (admin, educator)
  @Get()
  @Roles('admin', 'educator')
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryClassDto,
  ) {
    return this.classService.findAll(orgId, query);
  }

  // GET /classes/:id  (admin, educator)
  @Get(':id')
  @Roles('admin', 'educator')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.classService.findById(id, orgId);
  }

  // PATCH /classes/:id  (admin)
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.update(id, orgId, dto);
  }

  // DELETE /classes/:id  (admin)
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.classService.archive(id, orgId);
  }

  // POST /classes/:id/enroll  (admin)
  @Post(':id/enroll')
  @Roles('admin')
  async enrollStudent(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.classService.enrollStudent(id, orgId, dto);
  }

  // GET /classes/:id/enrollments  (admin, educator)
  @Get(':id/enrollments')
  @Roles('admin', 'educator')
  async getEnrollments(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.classService.getEnrollments(id, orgId);
  }

  // PATCH /classes/:classId/enrollments/:enrollmentId  (admin)
  @Patch(':classId/enrollments/:enrollmentId')
  @Roles('admin')
  async updateEnrollment(
    @Param('classId') classId: string,
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.classService.updateEnrollment(classId, enrollmentId, orgId, dto);
  }

  // POST /classes/:id/reassign-educator  (admin)
  @Post(':id/reassign-educator')
  @Roles('admin')
  async reassignEducator(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: ReassignEducatorDto,
  ) {
    return this.classService.reassignEducator(id, orgId, dto);
  }
}

// ── Student routes ────────────────────────────────────────────────────────────

@Controller('student/classes')
@UseGuards(AuthGuard, RolesGuard)
export class StudentClassController {
  constructor(private readonly classService: ClassService) {}

  // GET /student/classes
  // Returns all classes the logged-in student is actively enrolled in
  @Get()
  @Roles('student')
  async getMyClasses(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.classService.getStudentClasses(studentId, orgId);
  }

  // GET /student/classes/:classId
  // Returns single class detail — 403 if not enrolled
  @Get(':classId')
  @Roles('student')
  async getMyClass(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.classService.getStudentClassById(classId, studentId, orgId);
  }
}