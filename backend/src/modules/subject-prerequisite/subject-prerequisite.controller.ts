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
  BatchPrerequisiteCheckDto,
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
  /**
   * Transposed batch: for each student, is every one of `subject_ids`
   * eligible? Used by the admin enrollment surfaces to gray out students the
   * enroll gate would reject, before an enroll attempt is made.
   *
   * org_id comes from the token only — never from the body — so the batch
   * cannot read another tenant's grades or prerequisite links.
   */
  @Post('check-batch')
  @Roles('admin', 'platform_owner')
  async checkEligibilityBatch(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: BatchPrerequisiteCheckDto,
  ) {
    const studentIds = [...new Set(dto.student_ids)];

    // One batched call per subject; the transposed service method keeps the
    // whole request to a fixed number of queries instead of one pair per
    // student.
    const byStudent = new Map<
      string,
      Record<string, { eligible: boolean; missing: unknown[] }>
    >();
    for (const studentId of studentIds) byStudent.set(studentId, {});

    for (const subjectId of [...new Set(dto.subject_ids)]) {
      const result =
        await this.prerequisiteService.checkEligibilityForStudentsBatch(
          subjectId,
          studentIds,
          orgId,
        );
      for (const studentId of studentIds) {
        const entry =
          result.get(studentId) ?? { eligible: true, missing: [] };
        byStudent.get(studentId)![subjectId] = entry;
      }
    }

    // Return the map BARE: the global ResponseInterceptor (main.ts) already
    // wraps every handler result as { success, data }. Returning { data } here
    // would double-wrap into { success, data: { data: {...} } }, and the
    // client would unwrap to a non-map object and read every student as
    // eligible. Every other controller in this codebase returns a bare
    // payload for exactly this reason.
    return Object.fromEntries(byStudent);
  }
}
