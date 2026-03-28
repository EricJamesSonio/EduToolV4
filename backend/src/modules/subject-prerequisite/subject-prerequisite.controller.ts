import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { SubjectPrerequisiteService } from './subject-prerequisite.service'
import {
  CreatePrerequisiteDto,
  BulkCreatePrerequisiteDto,
} from './dto/subject-prerequisite.dto'
import { AuthGuard } from '@commons/guards/auth.guard'
import { RoleGuard } from '@commons/guards/role.guard'
import { Roles } from '@commons/decorators/roles.decorator'
import { CurrentUser } from '@commons/decorators/current-user.decorator'

@UseGuards(AuthGuard, RoleGuard)
@Controller('subject-prerequisites')
export class SubjectPrerequisiteController {
  constructor(
    private readonly prerequisiteService: SubjectPrerequisiteService,
  ) {}

  // Add a single prerequisite link
  @Post()
  @Roles('admin', 'platform_owner')
  create(@Body() dto: CreatePrerequisiteDto) {
    return this.prerequisiteService.create(dto)
  }

  // Replace all prerequisites for a subject in one call (used during seeding/setup)
  @Post('bulk')
  @Roles('admin', 'platform_owner')
  bulkCreate(@Body() dto: BulkCreatePrerequisiteDto) {
    return this.prerequisiteService.bulkCreate(dto)
  }

  // List all prerequisites for a given subject
  @Get()
  @Roles('admin', 'educator', 'platform_owner')
  findBySubject(
    @CurrentUser() user: any,
    @Query('subject_id') subject_id: string,
  ) {
    return this.prerequisiteService.findBySubject(subject_id, user.org_id)
  }

  // Check if a student is eligible to enroll in a subject
  @Get('check')
  @Roles('admin', 'platform_owner')
  checkEligibility(
    @CurrentUser() user: any,
    @Query('subject_id') subject_id: string,
    @Query('student_id') student_id: string,
  ) {
    return this.prerequisiteService.checkEligibility(
      subject_id,
      student_id,
      user.org_id,
    )
  }

  // Remove a single prerequisite link by prerequisite_id
  @Delete(':prerequisite_id')
  @Roles('admin', 'platform_owner')
  remove(
    @Param('prerequisite_id') prerequisite_id: string,
    @Query('subject_id') subject_id: string,
    @CurrentUser() user: any,
  ) {
    return this.prerequisiteService.remove(
      prerequisite_id,
      subject_id,
      user.org_id,
    )
  }
}