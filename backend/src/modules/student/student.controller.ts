// @/modules/student/student.controller.ts
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { StudentService } from './student.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentStatusDto,
  QueryStudentDto,
} from './dto/student.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('students')
@UseGuards(AuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentService.create(orgId, dto);
  }

  // NOTE: all static-path GET routes must come before /:id

  @Get('credentials-csv')
  @Roles('admin')
  async getCredentialsCsv(
    @CurrentUser('orgId') orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.studentService.getCredentialsCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student-credentials.csv"');
    res.send(csv);
  }

  // ✅ #4 — GET /students/import-template
  @Get('import-template')
  @Roles('admin')
  async getImportTemplate(@Res() res: Response) {
    const csv = this.studentService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student-import-template.csv"');
    res.send(csv);
  }

  @Post('import')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async bulkImport(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No file uploaded.');
    const csvContent = file.buffer.toString('utf-8');
    return this.studentService.bulkImport(orgId, csvContent);
  }

  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryStudentDto,
  ) {
    return this.studentService.findAll(orgId, query);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.studentService.findById(id, orgId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, orgId, dto);
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.studentService.updateStatus(id, orgId, dto);
  }

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