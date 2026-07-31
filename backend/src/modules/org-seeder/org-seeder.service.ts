import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { seedId } from './seed-id';
import { SeedContext } from './seed-context';
import type { SeedResult, OrgSeedOptions } from './seed-context';
import { AuditLogService } from '../audit-log/audit-log.service';

import { ProgramSeederService } from './seeders/program-seeder.service';
import { CourseSeederService } from './seeders/course-seeder.service';
import { StrandSeederService } from './seeders/strand-seeder.service';
import { LevelSectionSeederService } from './seeders/level-section-seeder.service';
import { GradingScaleSeederService } from './seeders/grading-scale-seeder.service';
import { GradingSchemeSeederService } from './seeders/grading-scheme-seeder.service';
import { SemesterTemplateSeederService } from './seeders/semester-template-seeder.service';
import { MajorSubjectSeederService } from './seeders/major-subject-seeder.service';
import { MinorSubjectSeederService } from './seeders/minor-subject-seeder.service';
import { PrerequisiteSeederService } from './seeders/prerequisite-seeder.service';

export type { SeedResult, OrgSeedOptions, SeedCount, GradingScaleOption, GradingScaleRangeOption } from './seed-context';

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
    private readonly majorSubjectSeeder: MajorSubjectSeederService,
    private readonly minorSubjectSeeder: MinorSubjectSeederService,
    private readonly prerequisiteSeeder: PrerequisiteSeederService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async seedOrg(options: OrgSeedOptions & { actorId: string }): Promise<SeedResult> {
    const ctx = new SeedContext(this.db, options);

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
    if (ctx.seedSemesterTemplates) {
      await this.semesterTemplateSeeder.seed(ctx);
    }

    await this.majorSubjectSeeder.seed(ctx);
    await this.minorSubjectSeeder.seed(ctx);
    await this.prerequisiteSeeder.seed(ctx);

    this.auditLogService.logAdminAction({
      orgId: ctx.orgId,
      actorId: options.actorId,
      action: 'org_seeded',
      entityType: 'organization',
      entityId: ctx.orgId,
      metadata: {
        programsCreated: Object.keys(ctx.programMap ?? {}).length,
        coursesCreated: Object.keys(ctx.courseMap ?? {}).length,
      },
    }).catch(() => {});

    return ctx.result;
  }
}
