// @/modules/educator/educator.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EducatorService } from './educator.service';
import { EducatorSubjectService } from './educator-subject.service';
import { EducatorScheduleProfileService } from './educator-schedule-profile.service';
import {
  CreateEducatorDto,
  UpdateEducatorDto,
  QueryEducatorDto,
  UpdateEducatorStatusDto,
  BulkCreateEducatorDto,
  SetEducatorSubjectsDto,
  CarryOverEducatorSubjectsDto,
  SetEducatorScheduleProfileDto,
} from './dto/educator.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('educators')
@UseGuards(AuthGuard, RolesGuard)
export class EducatorController {
  constructor(
    private readonly educatorService: EducatorService,
    private readonly educatorSubjectService: EducatorSubjectService,
    private readonly scheduleProfileService: EducatorScheduleProfileService,
  ) {}

  /**
   * GET /educators/:id/schedule-profile
   * Returns the profile with `effectiveWeekdays` already intersected with the
   * org's school days, so the client never has to re-derive that rule.
   */
  @Get(':id/schedule-profile')
  @Roles('admin')
  async getScheduleProfile(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.scheduleProfileService.get(orgId, id);
  }

  /**
   * PUT /educators/:id/schedule-profile
   * Narrowing availability never blocks and never moves existing classes: it
   * reports how many already fall outside as a warning count.
   */
  @Put(':id/schedule-profile')
  @Roles('admin')
  async setScheduleProfile(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: SetEducatorScheduleProfileDto,
  ) {
    return this.scheduleProfileService.set(orgId, id, dto);
  }

  /**
   * GET /educators/:id/subjects
   * Subjects this educator is able to teach, with display context. The
   * generator assigns only from this set.
   */
  @Get(':id/subjects')
  @Roles('admin')
  async listSubjects(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorSubjectService.listForEducator(orgId, id);
  }

  /**
   * PUT /educators/:id/subjects
   * Replaces the whole set. Rejecting rather than silently dropping unknown
   * ids is deliberate: a typo must not quietly shrink an educator's profile.
   */
  @Put(':id/subjects')
  @Roles('admin')
  async setSubjects(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: SetEducatorSubjectsDto,
  ) {
    return this.educatorSubjectService.replaceSet(orgId, id, dto.subjectIds, actorId);
  }

  /**
   * POST /educators  @Roles(ADMIN)
   * Admin creates an educator account.
   * Returns plain password once for distribution.
   */
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateEducatorDto,
  ) {
    return this.educatorService.create(orgId, dto);
  }

  /**
   * POST /educators/bulk  @Roles(ADMIN)
   * Takes an array of names, sanitizes, generates emailNames, builds emails,
   * checks duplicates, and creates all educator accounts.
   */
  @Post('bulk')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async bulkCreate(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: BulkCreateEducatorDto,
  ) {
    return this.educatorService.bulkCreate(orgId, dto.entries);
  }

  /**
   * POST /educators/carry-over-subjects
   * Copies teachable subjects from one school year to another, matching on
   * name + program type + parent names. Unmatched links are reported, never
   * guessed.
   *
   * Declared alongside the other static routes on purpose: Nest matches in
   * declaration order, so a route nested after `@Get(':id')` would never fire.
   */
  @Post('carry-over-subjects')
  @Roles('admin')
  async carryOverSubjects(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CarryOverEducatorSubjectsDto,
  ) {
    return this.educatorSubjectService.carryOver(
      orgId,
      dto.fromSchoolYearId,
      dto.toSchoolYearId,
      dto.educatorIds,
      actorId,
    );
  }

  /**
   * GET /educators
   * Returns all educators in the org. Supports ?search= by name or ID.
   * All authenticated roles can view.
   */
  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryEducatorDto,
  ) {
    return this.educatorService.findAll(orgId, query);
  }

  /**
   * GET /educators/:id
   * Returns a single educator's profile.
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorService.findById(id, orgId);
  }

  /**
   * PATCH /educators/:id  @Roles(ADMIN)
   * Admin updates educator name or email.
   */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateEducatorDto,
  ) {
    return this.educatorService.update(id, orgId, dto);
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateEducatorStatusDto,
  ) {
    return this.educatorService.updateStatus(id, orgId, dto);
  }

  /**
   * DELETE /educators/:id  @Roles(ADMIN)
   * Soft deletes the educator.
   * Phase 3: blocked if active classes exist.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    await this.educatorService.remove(id, orgId);
  }

  /**
   * POST /educators/:id/reset-password  @Roles(ADMIN)
   * Generates a new system password. Returns it plain once for Admin to distribute.
   * Previous password is immediately invalidated.
   */
  @Post(':id/reset-password')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.educatorService.resetPassword(id, orgId);
  }
}
