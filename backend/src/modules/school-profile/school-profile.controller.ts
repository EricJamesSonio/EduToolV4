import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchoolProfileService } from './school-profile.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import {
  CreateProfileCourseDto,
  UpdateProfileCourseDto,
  CreateProfileStrandDto,
  UpdateProfileStrandDto,
  CreateProfileLevelDto,
  UpdateProfileLevelDto,
  CreateProfileSectionDto,
  UpdateProfileSectionDto,
  CreateProfileSubjectDto,
  UpdateProfileSubjectDto,
} from './dto/school-profile.dto';

@Controller('school-profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class SchoolProfileController {
  constructor(private readonly service: SchoolProfileService) {}

  @Get()
  async getProfile(@CurrentUser('org_id') orgId: string) {
    return this.service.getProfile(orgId);
  }

  @Post('departments/:type/select')
  async selectDepartment(
    @Param('type') type: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.selectDepartment(orgId, type);
  }

  @Delete('departments/:type')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deselectDepartment(
    @Param('type') type: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deselectDepartment(orgId, type);
  }

  @Post('departments/:departmentId/courses')
  async createCourse(
    @Param('departmentId') departmentId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProfileCourseDto,
  ) {
    return this.service.createCourse(orgId, departmentId, dto);
  }

  @Patch('courses/:id')
  async updateCourse(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProfileCourseDto,
  ) {
    return this.service.updateCourse(id, orgId, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deleteCourse(id, orgId);
  }

  @Post('departments/:departmentId/strands')
  async createStrand(
    @Param('departmentId') departmentId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProfileStrandDto,
  ) {
    return this.service.createStrand(orgId, departmentId, dto);
  }

  @Patch('strands/:id')
  async updateStrand(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProfileStrandDto,
  ) {
    return this.service.updateStrand(id, orgId, dto);
  }

  @Delete('strands/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStrand(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deleteStrand(id, orgId);
  }

  @Post('departments/:departmentId/levels')
  async createLevel(
    @Param('departmentId') departmentId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProfileLevelDto,
  ) {
    return this.service.createLevel(orgId, departmentId, dto);
  }

  @Patch('levels/:id')
  async updateLevel(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProfileLevelDto,
  ) {
    return this.service.updateLevel(id, orgId, dto);
  }

  @Delete('levels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLevel(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deleteLevel(id, orgId);
  }

  @Post('levels/:levelId/sections')
  async createSection(
    @Param('levelId') levelId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProfileSectionDto,
  ) {
    return this.service.createSection(orgId, levelId, dto);
  }

  @Patch('sections/:id')
  async updateSection(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProfileSectionDto,
  ) {
    return this.service.updateSection(id, orgId, dto);
  }

  @Delete('sections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deleteSection(id, orgId);
  }

  @Post('levels/:levelId/subjects')
  async createSubject(
    @Param('levelId') levelId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateProfileSubjectDto,
  ) {
    return this.service.createSubject(orgId, levelId, dto);
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateProfileSubjectDto,
  ) {
    return this.service.updateSubject(id, orgId, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubject(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.service.deleteSubject(id, orgId);
  }
}
