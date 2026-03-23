// src/modules/student/student.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StudentService } from './student.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentStatusDto,
  QueryStudentDto,
} from './dto/student.dto';
import { AuthGuard } from 'src/commons/guards/auth.guard';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Controller('students')
@UseGuards(AuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * POST /students  @Roles(ADMIN)
   * Admin creates a student account. Returns plain password once.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentService.create(orgId, dto);
  }

  /**
   * GET /students/credentials-csv  @Roles(ADMIN)
   * Returns a CSV file of all student credentials.
   * NOTE: must be defined BEFORE :id route to avoid route collision.
   */
  @Get('credentials-csv')
  @Roles('admin')
  async getCredentialsCsv(
    @CurrentUser('orgId') orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.studentService.getCredentialsCsv(orgId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="student-credentials.csv"',
    );
    res.send(csv);
  }

  /**
   * POST /students/import  @Roles(ADMIN)
   * Bulk import students from a CSV file upload.
   * Returns validation report if errors exist.
   */
  @Post('import')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async bulkImport(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded.');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.studentService.bulkImport(orgId, csvContent);
  }

  /**
   * GET /students
   * Returns all students. Supports filters: ?search= ?status= ?levelId= ?sectionId=
   */
  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryStudentDto,
  ) {
    return this.studentService.findAll(orgId, query);
  }

  /**
   * GET /students/:id
   * Returns a single student's profile.
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.studentService.findById(id, orgId);
  }

  /**
   * PATCH /students/:id  @Roles(ADMIN)
   * Updates student profile fields.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, orgId, dto);
  }

  /**
   * PATCH /students/:id/status  @Roles(ADMIN)
   * Changes student status. Irreversible transitions require a reason.
   */
  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.studentService.updateStatus(id, orgId, dto);
  }

  /**
   * POST /students/:id/reset-password  @Roles(ADMIN)
   * Generates a new system password. Returns plain once for distribution.
   */
  @Post(':id/reset-password')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.studentService.resetPassword(id, orgId);
  }
}