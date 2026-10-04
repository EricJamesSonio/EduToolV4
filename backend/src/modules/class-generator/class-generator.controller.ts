import { Controller, Post, Get, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ClassGeneratorService } from './class-generator.service';
import {
  GenerateClassesDto,
  CommitGenerateDto,
  GenerateReadinessDto,
  GeneratorRosterQueryDto,
} from './dto/class-generator.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { DatabaseService } from '@/core/database/database.provider';

/**
 * Admin-only. Every route is POST and takes explicit ids from the body rather
 * than trusting a scope the client claims.
 */
@Controller('class-generator')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ClassGeneratorController {
  constructor(
    private readonly generator: ClassGeneratorService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * GET /class-generator/readiness?schoolYearId=&programIds=
   *
   * Called before a preview so the admin sees what is missing while they are
   * still choosing, not after they have clicked Generate.
   */
  @Get('readiness')
  async readiness(
    @CurrentUser('org_id') orgId: string,
    @Query() query: GenerateReadinessDto & { programIds?: string },
  ) {
    const programIds = (query.programIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (programIds.length === 0) {
      throw new ForbiddenException('Select at least one department.');
    }
    return this.generator.readiness({
      orgId,
      schoolYearId: query.schoolYearId,
      programIds,
      semesterId: '',
    });
  }

  /**
   * GET /class-generator/roster?schoolYearId=
   *
   * Who can teach what this year, for the generate page's roster panel.
   * Read-only. Everything is org-scoped inside the service.
   */
  @Get('roster')
  async roster(
    @CurrentUser('org_id') orgId: string,
    @Query() query: GeneratorRosterQueryDto,
  ) {
    return this.generator.roster(orgId, query.schoolYearId);
  }

  /** POST /class-generator/preview — builds a plan. Writes nothing. */
  @Post('preview')
  async preview(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: GenerateClassesDto,
  ) {
    return this.generator.preview({
      orgId,
      schoolYearId: dto.schoolYearId,
      programIds: dto.programIds,
      semesterId: dto.semesterId,
      sectionIds: dto.sectionIds,
      windowStart: dto.windowStart,
      windowEnd: dto.windowEnd,
      maxItems: dto.maxItems,
    });
  }

  /** POST /class-generator/commit — writes the approved plan. */
  @Post('commit')
  async commit(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CommitGenerateDto,
  ) {
    if (!dto.confirmed) {
      throw new ForbiddenException(
        'Review the preview and confirm before generating classes.',
      );
    }
    // Re-check the org scoping server-side. The ids come from the request, so
    // they must belong to THIS org before anything is written.
    await this.assertScopeOwned(orgId, dto);

    return this.generator.commit(
      {
        orgId,
        schoolYearId: dto.schoolYearId,
        programIds: dto.programIds,
        semesterId: dto.semesterId,
        sectionIds: dto.sectionIds,
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
        maxItems: dto.maxItems,
      },
      actorId,
    );
  }

  private async assertScopeOwned(
    orgId: string,
    dto: GenerateClassesDto,
  ): Promise<void> {
    const sectionIds = [...new Set(dto.sectionIds ?? [])];
    const [semesters, programs, sections] = await Promise.all([
      this.db.semester.count({
        where: { id: dto.semesterId, org_id: orgId },
      }),
      this.db.program.count({
        where: { id: { in: dto.programIds }, org_id: orgId },
      }),
      sectionIds.length > 0
        ? this.db.section.count({
            where: { id: { in: sectionIds }, org_id: orgId },
          })
        : 0,
    ]);
    if (
      semesters !== 1 ||
      programs !== new Set(dto.programIds).size ||
      sections !== sectionIds.length
    ) {
      throw new ForbiddenException(
        'The selected semester, department, or section does not belong to this organization.',
      );
    }
  }
}