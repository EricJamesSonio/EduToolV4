// backend/src/modules/semester/semester.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SemesterService } from './semester.service';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

@Controller('semester-settings')
@UseGuards(AuthGuard, RolesGuard)
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string, // <-- change here
    @Body() dto: CreateSemesterDto,
  ) {
    return this.semesterService.create(orgId, dto);
  }

  @Get()
  async findAll(@CurrentUser('org_id') orgId: string) {
    // <-- change here
    return this.semesterService.findAll(orgId);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateSemesterDto,
  ) {
    return this.semesterService.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string, // <-- change here
  ) {
    await this.semesterService.remove(id, orgId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Student
// ─────────────────────────────────────────────────────────────────────────────

@Controller('student/semesters')
@UseGuards(AuthGuard, RolesGuard)
export class StudentSemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  /**
   * GET /student/semesters
   * Returns slim semester list for the student's org — used for client-side
   * filtering on the My Classes page.
   */
  @Get()
  @Roles('student')
  async findAll(@CurrentUser('org_id') orgId: string) {
    const semesters = await this.semesterService.findAll(orgId);
    return semesters.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.start_date,
      endDate: s.end_date,
    }));
  }
}
