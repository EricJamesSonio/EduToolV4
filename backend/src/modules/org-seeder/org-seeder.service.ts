import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { seedId } from './seed-id';
import { SeedContext } from './seed-context';
import type { SeedResult, OrgSeedOptions } from './seed-context';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DEFAULT_CONCERN_CATEGORIES } from '../concern/data/default-categories.data';

import { ProgramSeederService } from './seeders/program-seeder.service';
import { CourseSeederService } from './seeders/course-seeder.service';
import { StrandSeederService } from './seeders/strand-seeder.service';
import { LevelSectionSeederService } from './seeders/level-section-seeder.service';
import { GradingScaleSeederService } from './seeders/grading-scale-seeder.service';
import { GradingSchemeSeederService } from './seeders/grading-scheme-seeder.service';
import { SemesterTemplateSeederService } from './seeders/semester-template-seeder.service';
import { ProgramCalendarSeederService } from './seeders/program-calendar-seeder.service';
import { MajorSubjectSeederService } from './seeders/major-subject-seeder.service';
import { MinorSubjectSeederService } from './seeders/minor-subject-seeder.service';
import { PrerequisiteSeederService } from './seeders/prerequisite-seeder.service';
import { SchoolProfileService } from '../school-profile/school-profile.service';

export type {
  SeedResult,
  OrgSeedOptions,
  SeedCount,
  GradingScaleOption,
  GradingScaleRangeOption,
} from './seed-context';

@Injectable()
export class OrgSeederService {
  constructor(
    private readonly db: DatabaseService,
    private readonly programSeeder: ProgramSeederService,
    private readonly courseSeeder: CourseSeederService,
    private readonly strandSeeder: StrandSeederService,
    private readonly levelSectionSeeder: LevelSectionSeederService,
    private readonly gradingScaleSeeder: GradingScaleSeederService,
    private readonly gradingSchemeSeeder: GradingSchemeSeederService,
    private readonly semesterTemplateSeeder: SemesterTemplateSeederService,
    private readonly programCalendarSeeder: ProgramCalendarSeederService,
    private readonly majorSubjectSeeder: MajorSubjectSeederService,
    private readonly minorSubjectSeeder: MinorSubjectSeederService,
    private readonly prerequisiteSeeder: PrerequisiteSeederService,
    private readonly auditLogService: AuditLogService,
    private readonly schoolProfileService: SchoolProfileService,
  ) {}

  async seedOrg(
    options: OrgSeedOptions & { actorId: string },
  ): Promise<SeedResult> {
    const ctx = new SeedContext(this.db, options);
    const profileByType = await this.schoolProfileService.getAllByType(ctx.orgId);
    Object.assign(ctx.profileDepartments, profileByType);
    const [gradingScales, gradingSchemes, semesterTerms] = await Promise.all([
      this.schoolProfileService.getGradingScales(ctx.orgId),
      this.schoolProfileService.getGradingSchemes(ctx.orgId),
      this.schoolProfileService.getSemesterTermConfigs(ctx.orgId),
    ]);
    for (const gs of gradingScales) {
      ctx.profileGradingScales[gs.programType] = { name: gs.name, ranges: gs.ranges as any };
    }
    for (const scheme of gradingSchemes) {
      ctx.profileGradingSchemes[scheme.programType] = { name: scheme.name, components: scheme.components as any };
    }
    for (const cfg of semesterTerms) {
      ctx.profileSemesterTerms[cfg.programType] = cfg.terms as string[];
    }

    await this.db.orgEnrollmentSetting.upsert({
      where: { org_id: ctx.orgId },
      update: {},
      create: {
        id: seedId('org-enrollment-setting', ctx.orgId),
        org_id: ctx.orgId,
        require_semester_reenrollment: false,
        auto_unenroll_on_year_end: true,
      },
    });

    // One-row-per-org concern digest setting, mirroring OrgEnrollmentSetting.
    await this.db.orgConcernSetting.upsert({
      where: { org_id: ctx.orgId },
      update: {},
      create: { org_id: ctx.orgId },
    });

    // Seed default concern categories (idempotent per unique [org_id, label]).
    for (const label of DEFAULT_CONCERN_CATEGORIES) {
      await this.db.concernCategory.upsert({
        where: {
          org_id_label: { org_id: ctx.orgId, label },
        },
        update: {},
        create: { org_id: ctx.orgId, label, is_default: true },
      });
    }

    await this.programSeeder.seed(ctx);
    await this.courseSeeder.seed(ctx);
    await this.strandSeeder.seed(ctx);

    console.log('courseMap keys:', Object.keys(ctx.courseMap));
    console.log('strandMap keys:', Object.keys(ctx.strandMap));
    console.log('sectionConfigs keys:', Object.keys(ctx.sectionConfigs));

    await this.levelSectionSeeder.seed(ctx);

    if (ctx.seedGradingScales) {
      await this.gradingScaleSeeder.seed(ctx);
    }
    if (ctx.seedGradingSchemes) {
      await this.gradingSchemeSeeder.seed(ctx);
    }
    await this.programCalendarSeeder.seed(ctx);
    if (ctx.seedSemesterTemplates) {
      await this.semesterTemplateSeeder.seed(ctx);
    }

    await this.majorSubjectSeeder.seed(ctx);
    await this.minorSubjectSeeder.seed(ctx);
    await this.prerequisiteSeeder.seed(ctx);

    this.auditLogService
      .logAdminAction({
        orgId: ctx.orgId,
        actorId: options.actorId,
        action: 'org_seeded',
        entityType: 'organization',
        entityId: ctx.orgId,
        metadata: {
          programsCreated: Object.keys(ctx.programMap ?? {}).length,
          coursesCreated: Object.keys(ctx.courseMap ?? {}).length,
        },
      })
      .catch(() => {});

    return ctx.result;
  }
}
