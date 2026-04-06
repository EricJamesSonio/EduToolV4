import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { CourseService }   from './course.service'
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from './dto/course.dto'
import { AuthGuard }       from '@/commons/guards/auth.guard'
import { RolesGuard }      from '@/commons/guards/role.guard'
import { Roles }           from '@/commons/decorators/roles.decorator'
import { CurrentUser }     from '@/commons/decorators/current-user.decorator'

@UseGuards(AuthGuard, RolesGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles('admin', 'platform_owner')
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courseService.create(orgId, dto)
  }

  @Get()
  @Roles('admin', 'educator', 'platform_owner')
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: CourseQueryDto,
  ) {
    return this.courseService.findAll(orgId, query)
  }

  @Get(':id')
  @Roles('admin', 'educator', 'platform_owner')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.courseService.findOne(id, orgId)
  }

  @Patch(':id')
  @Roles('admin', 'platform_owner')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.update(id, orgId, dto)
  }

  @Delete(':id')
  @Roles('admin', 'platform_owner')
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.courseService.remove(id, orgId)
  }
}