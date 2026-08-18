import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubjectPrerequisiteService } from './subject-prerequisite.service';
import {
  CreatePrerequisiteDto,
  BulkCreatePrerequisiteDto,
} from './dto/subject-prerequisite.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('subject-prerequisites')
export class SubjectPrerequisiteController {
  constructor(
    private readonly prerequisiteService: SubjectPrerequisiteService,
  ) {}

  @Post()
  @Roles('admin', 'platform_owner')
  create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreatePrerequisiteDto,
  ) {
    return this.prerequisiteService.create(orgId, dto);
  }

  @Post('bulk')
  @Roles('admin', 'platform_owner')
  bulkCreate(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: BulkCreatePrerequisiteDto,
  ) {
    return this.prerequisiteService.bulkCreate(orgId, dto);
  }

  @Get()
  @Roles('admin', 'educator', 'platform_owner')
  findBySubject(
    @CurrentUser('org_id') orgId: string,
    @Query('subject_id') subject_id: string,
  ) {
    return this.prerequisiteService.findBySubject(subject_id, orgId);
  }

  @Get('check')
  @Roles('admin', 'platform_owner')
  checkEligibility(
    @CurrentUser('org_id') orgId: string,
    @Query('subject_id') subject_id: string,
    @Query('student_id') student_id: string,
  ) {
    return this.prerequisiteService.checkEligibility(
      subject_id,
      student_id,
      orgId,
    );
  }

  @Delete(':prerequisite_id')
  @Roles('admin', 'platform_owner')
  remove(
    @CurrentUser('org_id') orgId: string,
    @Param('prerequisite_id') prerequisite_id: string,
    @Query('subject_id') subject_id: string,
  ) {
    return this.prerequisiteService.remove(prerequisite_id, subject_id, orgId);
  }
}
